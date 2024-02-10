import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize OpenAI and AstraDB with your configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

function parseAnalysis(content: string) {
  try {
    const analysis = JSON.parse(content);
    if (analysis.mood && Array.isArray(analysis.keywords)) {
      return { mood: analysis.mood, keywords: analysis.keywords };
    }
  } catch (error) {
    console.error("Failed to parse JSON from content", error);
  }
  return null;
}

async function saveMessageToDatabase(sessionId: string, content: string, role: string, analysis: any = null) {
  const messagesCollection = await astraDb.collection("messages");
  
  // Define saveData with an index signature to allow any additional properties
  let saveData: {
    sessionId: string,
    role: string,
    content: string,
    length: number,
    createdAt: Date,
    [key: string]: any // Allows for mood and keywords or any other property
  } = {
    sessionId: sessionId,
    role: role,
    content: content,
    length: content.length,
    createdAt: new Date(),
  };

  if (role === "assistant" && analysis) {
    // Now you can safely add mood and keywords without TypeScript errors
    saveData.mood = analysis.mood;
    saveData.keywords = analysis.keywords;
  }

  await messagesCollection.insertOne(saveData);
}

export async function POST(req: any) {
  try {
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json();

    let docContext = "";
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        const { data } = await openai.embeddings.create({
          input: latestMessage,
          model: "text-embedding-ada-002",
        });

        const collection = await astraDb.collection(`chat_${similarityMetric}`);
        const cursor = collection.find({}, {
          sort: {
            $vector: data[0]?.embedding,
          },
          limit: 5,
        });
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    // Process and save messages before streaming logic
    for (const message of messages) {
      const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }

       // Insert your ragPrompt content here
   const ragPrompt = [
     {
  role: "system",
  content: `
    You are an AI designed with a specific purpose: to engage users in meaningful conversations about their current or recent experiences. Your goal is to collect feedback and insights to better understand user sentiment. You have access to a wealth of documents (referred to as docContext below) that should be used to inform your responses, ensuring they are relevant and insightful.

    There are three main tasks you need to perform:
    1. Use the provided document context (docContext) to tailor your conversation. This means you should incorporate information or themes from these documents into your responses wherever relevant.
    2. Engage users in a conversation about their experiences. You should act as a conversational agent designed to discuss their recent activities or feelings, helping them reflect and provide feedback.
    3. Upon receiving the message "*** Analyse our conversation so far ***", you must switch to an analytical mode. In this mode, you will not continue the conversation but instead provide an analysis of the conversation up to that point. The analysis should be in JSON format, detailing the user's mood and identifying keywords that have emerged in the conversation. The format should look like this:

        {
          "mood": "positive", "nuetral", or "negative", // based on the sentiment of the conversation
          "keywords": ["keyword1", "keyword2", "keyword3"] // the most relevant keywords or themes from the conversation
        }

    ${docContext} // This is where the document context will be dynamically inserted.

    Note: Maintain a professional and empathetic tone throughout the conversation, ensuring users feel heard and understood. Your responses should always remind users that you are an AI, especially if the conversation reaches a point that would be better handled by a human professional.
  `,
}
,
    ];
 
    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [
        {
          role: "system",
          content: docContext,
        },
        ...messages,
      ],
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        // Logic to execute when the stream starts
      },
      onCompletion: async (completion: string) => {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          await saveMessageToDatabase(sessionId, completion, 'assistant', analysis);
        } else {
          await saveMessageToDatabase(sessionId, completion, 'assistant');
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
