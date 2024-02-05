import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    let docContext = '';
    if (useRag) {
      const embeddings = []; // Store embeddings for all messages

      for (const message of messages) {
        if (message.role === 'user') {
          const { data } = await openai.embeddings.create({ input: message.content, model: 'text-embedding-ada-002' });
          const messageEmbedding = data[0]?.embedding;
          embeddings.push(messageEmbedding);
        }
      }

      // Now you have an array of embeddings for user messages
      // You can use these embeddings for both storage and contextualization

      const collection = await astraDb.collection(`chat_${similarityMetric}`);

      const cursor = collection.find(null, {
        sort: {
          $vector: embeddings[embeddings.length - 1], // Use the last message's embedding for sorting
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
    ];

    // Send all user inputs to the "journey_journals" collection with embeddings
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        const messageEmbedding = embeddings[i]; // Retrieve the corresponding embedding

        const collection = await astraDb.collection("journey_journals");
        await collection.insertOne({
          content: messages[i].content,
          embedding: messageEmbedding, // Store the embedding alongside the text
          sessionId: messages[i].sessionId, // Store the session ID if needed
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
    throw e;
  }
}