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

export async function POST(req, res) {
  console.log("Received request:", req.body);
  // res.status(200).json({ message: "Function executed successfully." });

  try {
    //export async function POST(req)
    const { messages, useRag, llm, similarityMetric } = await req.json();
    console.log("Received request 2:", req.body);

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
            "Analyze the mood, keywords, and intensity of the message. After each user input, always provide an analysis of the users message including:1. Mood: positive, negative, or neutral. 2. A list of 3 relevant or notable keywords from the user input. 3. An intensity of experience rating from 1 to 10.",
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
      tool_choice: "auto",
    });

    console.log("Initial OpenAI API Response:", response);

    if (
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].tool_calls
    ) {
      console.log("Received request 3:", req.body);
      const responseMessage = response.choices[0].message;

      const availableFunctions = {
        analyze_message: analyzeMessage,
      };

      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = functionToCall(functionArgs.message);
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResponse,
        });
      }
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: messages,
      }); // get a new response from the model where it can see the function response
      res.status(200).json(secondResponse.choices);
      return;
    } else {
      // Handle case where no choices are returned or the tool function result is not as expected
      console.error("Unexpected response format:", initialResponse);
      // res
      //   .status(500)
      //   .json({ error: "Received unexpected response format from OpenAI." });
      // return;
      // res.status(200).json({
      //   error: "No response or expected tool function result from OpenAI.",
      // });
    }

    console.log("response: ", response);
    logResponse(response);

    // // Extract analysis results and chat response
    // const { analysisResults, clientResponse } = parseResponse(response);

    // // Store the analysis results (if any) in the database
    // if (analysisResults) {
    //   await storeAnalysisData(sessionId, analysisResults);
    // }

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.log(
      "OpenAI API error:",
      error.response ? error.response.data : error.message,
    );
    // res
    //   .status(500)
    //   .json({ error: "Error calling OpenAI API", details: error.message });
    // return;
  }
}

function logResponse(response) {
  // Log the entire response object to the console
  console.log("OpenAI API Response:", JSON.stringify(response, null, 2));
}
