import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";

// Initialize OpenAI and AstraDB with your configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

// Function to parse the analysis object and extract Mood and Keywords
function parseAnalysis(content: string) {
  const regex = /"analysis"\s*:\s*{\s*"Mood"\s*:\s*"([^"]+)",\s*"Keywords"\s*:\s*\[([^\]]+)\]/;
  const match = content.match(regex);

  if (match) {
    const mood = match[1];
    const keywords = match[2].split(',').map(keyword => keyword.trim());
    return { Mood: mood, Keywords: keywords };
  } else {
    return null;
  }
}

async function saveMessageToDatabase(sessionId: string, content: string, role: string) {
  const messagesCollection = await astraDb.collection("messages");
  
  // Check for an existing message with the same content, role, and sessionId
 const exists = await messagesCollection.findOne({ sessionId, content, role });
  if (exists) {
    console.log("Message already saved to the database.");
    return; // Skip saving as this message is already saved
  }

  let analysis = null;
  if (role === "assistant") {
    analysis = parseAnalysis(content);
  }

  await messagesCollection.insertOne({
    sessionId: sessionId,
    messageId: uuidv4(),
    role: role,
    content: content,
    ...analysis,
    createdAt: new Date(),
  });
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
    
const ragPrompt = {
  role: "system",
  content: `
    You are an AI designed to engage in conversations, reflecting on the user's experiences with a structured analysis. Each response must include two parts: a conversational reply and a structured analysis. The analysis must identify the user's mood as "Positive", "Negative", or "Neutral" and list three relevant keywords.

    Structure your response like this example:
    {
      "response": "Your conversational response here...",
      "analysis": {
        "Mood": "positive",
        "Keywords": ["keyword1", "keyword2", "keyword3"]
      }
    }

    Always ensure to return a structured analysis with every response, as it is crucial for backend processing and enhancing user interaction.
    ${docContext}
  `,
};

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        for (const message of messages) {
          await saveMessageToDatabase(sessionId, message.content, message.role);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
