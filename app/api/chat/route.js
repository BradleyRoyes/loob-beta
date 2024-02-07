import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

export async function POST(req) {
  try {
  //export async function POST(req)
    const { messages, useRag, llm, similarityMetric } = await req.json();
  
    // Check if a session ID is provided in the request headers, or generate a new one
    let sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      sessionId = uuidv4();
      req.headers.set("x-session-id", sessionId);
    }
  
    let docContext = "";
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
  
      if (latestMessage) {
        // Generate embeddings for the latest message
        const { data } = await openai.embeddings.create({
          input: latestMessage,
          model: "text-embedding-ada-002",
        });
  
        // Retrieve similar documents from AstraDB based on embeddings
        const collection = await astraDb.collection(`chat_${similarityMetric}`);
        const cursor = collection.find(null, {
          sort: {
            $vector: data[0]?.embedding,
          },
          limit: 5,
        });
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }
  
    // Incorporate ragPrompt with docContext into the messages sent to OpenAI
    const initialMessage = {
      role: "system",
      content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences using compassionate inquiry, a framework developed by Gabor Maté. Engage users by encouraging them to share more about their experiences. Remember, remind the user when necessary that you are just a robot here to help them share and reflect on their experiences.
  
      Structure your response as follows (without quotes):
      "[Your response here]"
  
      ${docContext}
  
      If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`,
    };
  
    // Add the initialMessage to the start of the messages array
    messages.unshift(initialMessage);
  
    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_message",
          description:
            "Analyzes the mood, keywords, and intensity of the message",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The user message to analyze",
              },
            },
            required: ["message"],
          },
        },
      },
    ];
  
    // Send all user inputs to the "journey_journals" collection
    for (const message of messages) {
      if (message.role === "user") {
        const collection = await astraDb.collection("journey_journal");
        await collection.insertOne({
          ...message,
          sessionId: sessionId,
        });
      }
    }
  
    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: messages,
      tools: tools,
    });
  
    console.log("response: ", response);
    logResponse(response);
  
    // // Extract analysis results and chat response
    // const { analysisResults, clientResponse } = parseResponse(response);
  
    // // Store the analysis results (if any) in the database
    // if (analysisResults) {
    //   await storeAnalysisData(sessionId, analysisResults);
    // }
  
    const stream = OpenAIStream(response);
    return new stream;
    } catch (e) {
    throw e;
  }
}

runconvo().then(console.log).catch(console.error);

function logResponse(response) {
  // Log the entire response object to the console
  console.log("OpenAI API Response:", JSON.stringify(response, null, 2));
}
