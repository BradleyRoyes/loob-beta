import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";

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
    // Extract or generate a session token
    const sessionToken = req.headers.get('session-token') || uuidv4();

    let docContext = '';
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
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
        ${documents.map(doc => doc.content).join("\n")}
        END CONTEXT
      `;
    }

    // Create the system prompt as before
    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant answering questions about Cassandra and Astra DB. Format responses using markdown where applicable.
        ${docContext}
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`,
      },
    ];

    // Process each message as before but only attach the session token to entries for the journey_journals collection
    for (const message of messages) {
      if (message.role === 'user') {
        await astraDb.collection("journey_journals").insertOne({
          ...message,
          sessionToken, // Append sessionToken for each user message
        });
      }
    }

    // Generate chat completions as before
    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: [...ragPrompt, ...messages],
    });
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}