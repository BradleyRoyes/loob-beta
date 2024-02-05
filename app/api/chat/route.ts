import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

async function insertDataToJourneyJournal(sessionUUID, text, embeddings) {
  const collection = await astraDb.collection("journey_journal");
  await collection.insertOne({ sessionUUID, text, embeddings });
}

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

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

      docContext = `
        START CONTEXT
        ${documents?.map(doc => doc.content).join("\n")}
        END CONTEXT
      `
    }
    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences.
        ${docContext} 
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".
      `,
      },
    ]

    // Generate a session UUID for this session
    const sessionUUID = uuidv4();

    // Send all user inputs with session ID to the "journey_journal" collection
    for (const message of messages) {
      if (message.role === 'user') {
        insertDataToJourneyJournal(sessionUUID, message.content, null);
      }
    }

    // Send the latest chunk of text to "journey_journal" collection
    const chunk = messages[messages?.length - 1]?.content;
    const embedded = await openai.embeddings.create({ input: chunk, model: 'text-embedding-ada-002' });
    const embeddedText = embedded?.embeddings[0];
    insertDataToJourneyJournal(sessionUUID, chunk, embeddedText);

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