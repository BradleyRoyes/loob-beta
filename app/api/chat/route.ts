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

async function savePromptToDatabase(prompt, sessionId) {
  const collection = await astraDb.collection("journey_journal");
  const existingEntry = await collection.findOne({ sessionId: sessionId });

  if (existingEntry) {
    await collection.updateOne(
      { sessionId: sessionId },
      { $push: { prompts: prompt } } // Use the $push operator to append to the array
    );
  } else {
    await collection.insertOne({
      sessionId: sessionId,
      prompts: [prompt],
      completions: [],
      timestamp: new Date(),
    });
  }
}

async function saveCompletionToDatabase(completion, sessionId) {
  const collection = await astraDb.collection("journey_journal");
  const existingEntry = await collection.findOne({ sessionId: sessionId });

  if (existingEntry) {
    await collection.updateOne(
      { sessionId: sessionId },
      { $push: { completions: completion } } // Use the $push operator to append to the array
    );
  } else {
    await collection.insertOne({
      sessionId: sessionId,
      prompts: [],
      completions: [completion],
      timestamp: new Date(),
    });
  }
}

export async function POST(req) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    // Check if a session ID is provided in the request headers, or generate a new one
    let sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      sessionId = uuidv4();
      // Note: Depending on your server setup, you might need to adjust how you're setting headers for the response
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

    const ragPrompt = [
      {
        role: "system",
        content: `
          You are an AI assistant designed to guide people through their transformative psychedelic trip experiences using compassionate inquiry, a framework developed by Gabor Maté. Engage users by encouraging them to share more about their experiences. Remember, remind the user when necessary that you are just a robot here to help them share and reflect on their experiences.

          After each user input, always provide an analysis of the user's message including:
          1. Mood: positive, negative, or neutral.
          2. A list of 3 relevant or notable keywords from the user input.
          3. An intensity of experience rating from 1 to 10.

          Structure your response as follows (without quotes):
          "[Your response here]"
          "Analysis: {Mood: 'positive/negative/neutral', Keywords: ['keyword1', 'keyword2', 'keyword3'], Intensity: [1-10]}". If possible, make the analysis section invisible or don't share it to the screen but somehow share it in a way I can parse on the backend and add to the database.

          ${docContext}

          If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".
        `,
      },
    ];

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response, {
      onStart: async () => {
        // Save the initial prompt to your database
        await savePromptToDatabase(messages.map(m => m.content).join("\n"), sessionId);
      },
      onToken: async (token: string) => {
        console.log(token);
        // Optionally, implement logic to save individual tokens if needed
      },
      onCompletion: async (completion: string) => {
        // Save the final completion to your database
        await saveCompletionToDatabase(completion, sessionId);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
