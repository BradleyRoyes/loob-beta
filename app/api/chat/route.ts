import OpenAI from "openai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid"; // Ensure you have uuid installed (`npm install uuid`)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

// Helper function to ensure the collection exists
async function ensureCollectionExists() {
  try {
    const collections = await astraDb.collection("journey_journals");
    if (!collections) {
      await astraDb.createCollection("journey_journals");
      console.log("journey_journals collection created.");
    }
  } catch (error) {
    console.error("Error checking/creating collection:", error);
  }
}

export async function POST(req: Request) {
  await ensureCollectionExists(); // Ensure the collection exists before proceeding

  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();
    const sessionUuid = uuidv4(); // Generate a unique session UUID for each POST request

    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = "";
    if (useRag) {
      const { data } = await openai.embeddings.create({
        input: latestMessage,
        model: "text-embedding-ada-002",
      });

      const collection = await astraDb.collection(`chat_${similarityMetric}`);

      const documents = await collection
        .find({
          sort: { $vector: data[0]?.embedding },
          limit: 5,
        })
        .toArray();

      docContext = documents.map((doc) => doc.content).join("\n");
    }

    const ragPrompt = [
      {
        role: "system",
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences.
      ${docContext}
      If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`,
      },
    ];

    // Send all user inputs to the "journey_journals" collection with additional session UUID, mood, and substance
    for (const message of messages) {
      if (message.role === "user") {
        astraDb.collection("journey_journals").insertOne({
          ...message,
          sessionUuid,
          mood: "happy", // Random value for testing, replace as needed
          substance: "mushrooms", // Random value for testing, replace as needed
        });
      }
    }

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    // Assuming OpenAIStream and StreamingTextResponse are part of your utilities for handling streaming responses
    return new StreamingTextResponse(OpenAIStream(response));
  } catch (e) {
    console.error("Error in POST function:", e);
    return new Response(JSON.stringify({ error: e.toString() }), {
      status: 500,
    });
  }
}
