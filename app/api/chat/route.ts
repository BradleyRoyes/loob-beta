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
    const sessionToken = req.headers.get('session-token') || uuidv4(); // Corrected to use get method for headers

    let docContext = '';
    if (useRag && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        const { data } = await openai.embeddings.create({ input: latestMessage, model: 'text-embedding-ada-002' });
        const collection = await astraDb.collection(`chat_${similarityMetric}`);
        const documents = await collection.find({
          '$text': { '$search': latestMessage }
          // Assuming your collection supports text search; adjust according to your DB capabilities
        }).limit(5).toArray(); // Simplified for demonstration

        docContext = documents.map(doc => doc.content).join("\n");
      }
    }

    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences.
        ${docContext}
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer."`,
      },
    ];

    for (const message of messages) {
      if (message.role === 'user') {
        await astraDb.collection("journey_journals").insertOne({
          ...message,
          sessionToken, // Ensure the sessionToken is included with each message
        });
      }
    }

    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: [...ragPrompt, ...messages],
    });
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e); // Ensure proper error logging
    throw e; // Rethrow the error to handle it according to your application's logic
  }
}
