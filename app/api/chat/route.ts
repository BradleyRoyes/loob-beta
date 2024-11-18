import { NextRequest, NextResponse } from "next/server";
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { env } from "node:process";
import Pusher from "pusher";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

// Initialize Pusher
const pusher = new Pusher({
  appId: "1761208",
  key: "facc28e7df1eec1d7667",
  secret: "79b0023a6876ad35a230",
  cluster: "eu",
  useTLS: true,
});

function triggerPusherEvent(channel: string, event: string, data: any) {
  pusher.trigger(channel, event, data).catch((err) =>
    console.error(`Error triggering event on channel ${channel}:`, err)
  );
}

// Helper Function to Parse Analysis
function parseAnalysis(content: string) {
  const regex = /{[\s\S]*?"mood"\s*:\s*".*?",\s*"keywords"\s*:\s*\[.*?\]}/;
  const match = content.match(regex);
  if (match) {
    try {
      const analysis = JSON.parse(match[0]);
      if (analysis.mood && Array.isArray(analysis.keywords)) {
        return { mood: analysis.mood, keywords: analysis.keywords };
      }
    } catch (error) {
      console.error("Failed to parse JSON from content", error);
    }
  }
  return null;
}

// Save Message to Database
async function saveMessageToDatabase(
  sessionId: string,
  content: string,
  role: string,
  analysis: any = null
) {
  const messagesCollection = await astraDb.collection("messages");
  const existingMessage = await messagesCollection.findOne({
    sessionId,
    content,
  });

  if (existingMessage) {
    console.log("Duplicate message detected. Skipping save.");
    return;
  }

  const messageData = {
    sessionId,
    role,
    content,
    length: content.length,
    createdAt: new Date(),
    mood: analysis?.mood,
    keywords: analysis?.keywords,
  };

  await messagesCollection.insertOne(messageData);
}

// Fetch Dashboard Data
async function fetchDashboardData() {
  const messagesCollection = await astraDb.collection("messages");
  const messages = await messagesCollection.find({}).toArray();

  const moodCounts: Record<string, number> = {};
  const keywordCounts: Record<string, number> = {};

  for (const message of messages) {
    if (message.mood) {
      moodCounts[message.mood] = (moodCounts[message.mood] || 0) + 1;
    }

    if (Array.isArray(message.keywords)) {
      for (const keyword of message.keywords) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
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
    attendees: messages.length,
    interactions: messages.filter((msg) => msg.role === "user").length,
  };

  return { moodData, keywordData, engagementMetrics };
}

// API Routes

export async function GET(req: NextRequest) {
  try {
    const dashboardData = await fetchDashboardData();
    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, useRag, llm, similarityMetric } = await req.json();
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
          { sort: { $vector: data[0]?.embedding }, limit: 5 }
        );
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    for (const message of messages) {
      const analysis =
        message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(
        sessionId,
        message.content,
        message.role,
        analysis
      );
    }

    const ragPrompt = [
      {
        role: "system",
        content: `You are an AI assistant. Use the context to respond effectively: ${docContext}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: llm || "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          triggerPusherEvent("dashboard-updates", "data-update", analysis);
        }
        await saveMessageToDatabase(sessionId, completion, "assistant", analysis);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in POST function:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
