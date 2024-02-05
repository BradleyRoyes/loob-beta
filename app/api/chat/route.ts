import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is installed and imported for generating session IDs

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    // Generate a unique session ID for this batch of messages
    const sessionId = uuidv4();

    let docContext = '';
    if (useRag) {
      // Assuming we want the embedding for the latest message for some contextual retrieval
      const latestMessage = messages[messages.length - 1]?.content;
      const { data: embeddingData } = await openai.embeddings.create({ input: latestMessage, model: 'text-embedding-ada-002' });

      const collection = await astraDb.collection(`chat_${similarityMetric}`);

      // Use the embedding of the latest message to find similar documents
      const cursor = collection.find(null, {
        sort: {
          $vector: embeddingData[0]?.embedding,
        },
        limit: 5,
      });

      const documents = await cursor.toArray();

      docContext = `
        START CONTEXT
        ${documents.map(doc => doc.content).join("\n")}
        END CONTEXT
      `;
    }

    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant answering questions about Cassandra and Astra DB. Format responses using markdown where applicable.
        ${docContext}
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".
      `,
      },
      ...messages,
    ];

    // Iterate over messages to handle user inputs separately
    for (const message of messages) {
      if (message.role === 'user') {
        // Generate embeddings for each user message
        const { data: messageEmbedding } = await openai.embeddings.create({ input: message.content, model: 'text-embedding-ada-002' });

        // Save user messages along with their embeddings and session ID in "journey_journals"
        const collection = await astraDb.collection("journey_journals");
        await collection.insertOne({
          sessionId: sessionId,
          content: message.content,
          vector: messageEmbedding[0]?.embedding,
          timestamp: new Date(),
        });
      }
    }

    // Generate chat completions or responses
    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: ragPrompt,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e; // Ensure you handle this error appropriately in your actual code
  }
}
