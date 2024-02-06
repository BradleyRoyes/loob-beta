import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function POST(req) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    // Check if a session ID is provided in the request headers, or generate a new one
    let sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      sessionId = uuidv4();
      req.headers.set("x-session-id", sessionId);
    }

    let docContext = '';
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;

      if (latestMessage) {
        // Generate embeddings for the latest message
        const { data } = await openai.embeddings.create({
          input: latestMessage,
          model: 'text-embedding-ada-002',
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

    // Add mood assessment and relevant keywords to the Rag Prompt
    const ragPrompt = [
      {
        role: 'system',
        content: `You are an AI assistant designed to guide people through their transformative psychedelic trip experiences. Be compassionate and curious, engaging users to share more about their experiences'.
        ${docContext} 
        If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".

        Mood Assessment:
        - Positive
        - Neutral
        - Negative

        Relevant Keywords:
        - Keyword 1
        - Keyword 2
        - Keyword 3
      `,
      },
    ]

    // Send all user inputs, including metrics, to the "journey_journal" collection
    for (const message of messages) {
      if (message.role === 'user') {
        const collection = await astraDb.collection("journey_journal");

        // Include mood assessment and relevant keywords in the message
        message.mood = extractMetricsFromRagPrompt(ragPrompt[0].content).mood;
        message.keywords = extractMetricsFromRagPrompt(ragPrompt[0].content).keywords;

        // Insert the message into the collection, including session ID, text, mood, and keywords
        await collection.insertOne({
          sessionId: sessionId,
          text: message.content,
          mood: message.mood,
          keywords: message.keywords,
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

// Function to extract mood assessment and relevant keywords from Rag Prompt
const extractMetricsFromRagPrompt = (ragPromptText) => {
  const moodMatch = ragPromptText.match(/Mood Assessment:\s*-\s*([^]*)/);
  const keywordsMatch = ragPromptText.match(/Relevant Keywords:\s*-\s*([^]*)/);

  if (moodMatch && keywordsMatch) {
    const mood = moodMatch[1].trim();
    const keywords = keywordsMatch[1].split('\n').map((keyword) => keyword.trim());

    return {
      mood,
      keywords,
    };
  }

  return null;
};