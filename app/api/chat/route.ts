import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = '';
    let latestMessageEmbedding = null; // Store the latest message embedding for context retrieval
    let userMessageEmbeddings = []; // Store user message embeddings for saving to "journey_journals"

    if (useRag && latestMessage) {
      // Generate embedding for the latest user message
      const { data } = await openai.embeddings.create({ input: latestMessage, model: 'text-embedding-ada-002' });

      latestMessageEmbedding = data[0]?.embedding; // Store the embedding

      // Retrieve context documents based on the embedding
      const collection = await astraDb.collection(`chat_${similarityMetric}`);
      const cursor = collection.find({}, {
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

    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences'.
        ${docContext} 
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".
      `,
      },
    ];

    // Send all user inputs to the "journey_journals" collection
    for (const message of messages) {
      if (message.role === 'user') {
        // Generate embeddings for user messages and store them separately
        const { data } = await openai.embeddings.create({ input: message.content, model: 'text-embedding-ada-002' });
        const userMessageEmbedding = data[0]?.embedding;

        userMessageEmbeddings.push({
          content: message.content,
          embedding: userMessageEmbedding,
        });

        // Save the message content and its corresponding embedding to "journey_journals"
        const collection = await astraDb.collection("journey_journals");
        await collection.insertOne({
          content: message.content,
          embedding: userMessageEmbedding, // Store the embedding alongside the text
        });
      }
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
