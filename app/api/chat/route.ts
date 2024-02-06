import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json(); // Assuming sessionId is now part of the request payload

    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = '';
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

      // Use documents to form context for ChatGPT responses
      docContext = `
        START CONTEXT
        ${documents?.map(doc => doc.content).join("\n")}
        END CONTEXT
      `;
    }

    // Adjust the content of ragPrompt to match your application's context and requirements
    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences.
        ${docContext} 
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`
      },
    ];

    // Insert each user message into the "journey_journal" collection with sessionId
    for (const message of messages) {
      if (message.role === 'user') {
        const collection = await astraDb.collection("journey_journal");
        await collection.insertOne({ ...message, sessionId }); // Add sessionId to each message
      }
    }

    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: [...ragPrompt, ...messages], // Combine ragPrompt and messages for the ChatGPT prompt
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    throw e;
  }
}
