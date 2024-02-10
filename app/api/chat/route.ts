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
  
  let saveData = {
    sessionId: sessionId,
    role: role,
    content: content,
    length: content.length,
    createdAt: new Date(),
    ...(analysis ? { mood: analysis.mood, keywords: analysis.keywords } : {})
  };

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

    const ragPrompt = {
      role: "system",
      content: `
        You are an AI designed to engage in meaningful conversations about the user's experiences. Incorporate the document context (docContext) to provide insightful responses. When receiving "*** Analyse our conversation so far ***", respond with a JSON-formatted analysis of the conversation, including mood and keywords.
        
        ${docContext}
        
        Note: Your responses should maintain a professional and empathetic tone throughout the conversation.
      `
    };

    // Proceed with creating the chat completion request, including the ragPrompt
    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [ragPrompt, ...messages],
    });

    const stream = openai.OpenAIStream(response);

    // Process and save messages asynchronously without affecting the streaming to the user
    messages.forEach(async (message) => {
      const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
