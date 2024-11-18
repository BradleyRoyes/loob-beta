import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

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
        const cursor = collection.find(
          {},
          {
            sort: {
              $vector: data[0]?.embedding,
            },
            limit: 5,
          },
        );
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    const ragPrompt = [
      {
        role: "system",
        content: `
          You are Loob, an AI guide. Your purpose is to help users navigate unique experiences at the Cyberdelic Showcase. Match them with one of 11 experiences:
          RealmsOfFlow, VistaReality, MesmerPrism, TeraExperience, StarStuff, Visitations, Squingle, PatchWorld, CosmicSugar, BrainCandy, Synedelica.

          Only use this list. Use concise and playful tone. Ask users indirect questions to learn preferences without explicitly discussing the 11 experiences. Make magical recommendations when ready and explain your reasoning. If a user types "*** Analyse my messages ***," respond with:

          ***Loob Magic Analysis:***
          { "mood": "positive", "keywords": ["interactive", "immersive"] }

          Reference doc context: ${docContext}.
        `,
      },
    ];

    for (const message of messages) {
      const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response, {
      onCompletion: async (completion: string) => {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          await saveMessageToDatabase(sessionId, completion, "assistant", analysis);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in POST function:", error);
    return new Response("Error handling request", { status: 500 });
  }
}

// Helper Functions
function parseAnalysis(content: string) {
  const regex = /{[\s\S]*?"mood"\s*:\s*".*?",\s*"keywords"\s*:\s*\[.*?\]}/;
  const match = content.match(regex);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (error) {
      console.error("Failed to parse JSON from content:", error);
    }
  }
  return null;
}

async function saveMessageToDatabase(sessionId: string, content: string, role: string, analysis: any) {
  const messagesCollection = await astraDb.collection("messages");
  const messageData = {
    sessionId,
    role,
    content,
    createdAt: new Date(),
    mood: analysis?.mood,
    keywords: analysis?.keywords,
  };
  await messagesCollection.insertOne(messageData);
}

export async function GET(req: any) {
  try {
    const messagesCollection = await astraDb.collection("messages");
    const messages = await messagesCollection.find({}).toArray();

    const moodCounts: Record<string, number> = {};
    const keywordCounts: Record<string, number> = {};
    let totalAttendees = 0;
    let totalInteractions = 0;

    for (const message of messages) {
      if (message.mood) {
        moodCounts[message.mood] = (moodCounts[message.mood] || 0) + 1;
      }
      if (Array.isArray(message.keywords)) {
        for (const keyword of message.keywords) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
      totalInteractions++;
      if (message.role === "user") {
        totalAttendees++;
      }
    }

    const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
    }));

    const keywordData = Object.entries(keywordCounts).map(([keyword, count]) => ({
      keyword,
      count,
    }));

    const engagementMetrics = {
      attendees: totalAttendees,
      interactions: totalInteractions,
    };

    return new Response(
      JSON.stringify({
        moodData,
        keywordData,
        engagementMetrics,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET function:", error);
    return new Response("Failed to fetch data", { status: 500 });
  }
}
