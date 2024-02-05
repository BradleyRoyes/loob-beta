import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI and AstraDB clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

// Function to calculate embeddings for text input
async function calculateEmbedding(input: string): Promise<number[]> {
  const { data } = await openai.embeddings.create({ input, model: 'text-embedding-ada-002' });
  return data[0]?.embedding;
}

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    // Get the latest user message
    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = '';

    // Calculate embedding for the latest message if RAG is enabled
    let latestMessageEmbedding: number[] | null = null;
    if (useRag) {
      latestMessageEmbedding = await calculateEmbedding(latestMessage);

      // Retrieve context documents from AstraDB based on similarity metric
      const collection = await astraDb.collection(`chat_${similarityMetric}`);
      const cursor = collection.find(null, {
        sort: {
          $vector: latestMessageEmbedding,
        },
        limit: 5,
      });

      const documents = await cursor.toArray();

      docContext = `
        START CONTEXT
        ${documents?.map(doc => doc.content).join("\n")}
        END CONTEXT
      `;
    }

    // Create a RAG prompt with context and system message
    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences.
        ${docContext} 
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`,
      },
    ];

    // Generate or retrieve session ID using uuid
    let sessionId = messages.find(message => message.role === 'system' && message.sessionId)?.content;

    if (!sessionId) {
      sessionId = uuidv4(); // Generate a new session ID
    }

    // Send all user inputs to the "journey_journals" collection with session ID
    for (const message of messages) {
      if (message.role === 'user') {
        const content = message.content;
        const embedding = useRag ? latestMessageEmbedding : null;

        const collection = await astraDb.collection("journey_journals");
        await collection.insertOne({
          content,
          embedding, // Store the embedding alongside the text
          sessionId, // Store the session ID
        });
      }
    }

    // Generate AI response using OpenAI GPT model
    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    throw e;
  }
}