import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts"; // Import AstraDB without 'create'
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = '';
    let latestMessageEmbedding = null;
    if (useRag) {
      const { data } = await openai.embeddings.create({ input: latestMessage, model: 'text-embedding-ada-002' });

      const collection = await astraDb.collection(`chat_${similarityMetric}`);

      const cursor = collection.find(null, {
        sort: {
          $vector: data[0]?.embedding,
        },
        limit: 5,
      });

      const documents = await cursor.toArray();

      docContext = `
        START CONTEXT
        ${documents?.map(doc => doc.content).join("\n")}
        END CONTEXT
      `;

      // Store the latest message embedding
      latestMessageEmbedding = data[0]?.embedding;
    }
    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences.
        ${docContext} 
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`,
      },
    ]

    // Generate a session UUID for this session
    const sessionUUID = uuidv4();

    // Create an array to store data to be inserted into the "journey_journals" collection
    const dataToInsert = [];

    // Send all user inputs to the "journey_journals" collection with additional data
    for (const message of messages) {
      if (message.role === 'user') {
        // Include the session UUID, text, and embeddings
        const data = {
          sessionUUID,
          text: message.content,
          embeddings: latestMessageEmbedding, // Include the latest message embedding
        };
        dataToInsert.push(data);
      }
    }

    // Send data to the "journey_journals" collection (assuming it already exists)
    if (dataToInsert.length > 0) {
      const collection = await astraDb.collection("journey_journals");
      await collection.insertMany(dataToInsert);
    }

    const response = await openai.chat.completions.create(
      {
        model: llm ?? 'gpt-3.5-turbo',
        stream: true,
        messages: [...ragPrompt, ...messages],
      }
    );
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error("Error:", e);
    throw e;
  }
}