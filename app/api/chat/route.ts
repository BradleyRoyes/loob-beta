import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import Pusher from "pusher";
import { v4 as uuidv4 } from "uuid";
import { env } from "node:process";

// Initialize OpenAI and AstraDB clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

// Initialize Pusher
const pusher = new Pusher({
  appId: "1761208",
  key: "facc28e7df1eec1d7667",
  secret: "79b0023a6876ad35a230",
  cluster: "eu",
  useTLS: true,
});

function triggerPusherEvent(channel, event, data) {
  pusher
    .trigger(channel, event, data)
    .then(() => console.log(`Event ${event} triggered on channel ${channel}`))
    .catch((err) =>
      console.error(`Error triggering event on channel ${channel}:`, err)
    );
}

// Parse JSON analysis for mood and keywords
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

// Save messages to the database
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

// POST route to handle message saving and RAG prompt logic
export async function POST(req: any) {
  try {
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json();
    let docContext = "";

    // Retrieve context using embeddings if RAG is enabled
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
          }
        );
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    for (const message of messages) {
      const analysis =
        message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }

    // Construct the RAG prompt
    const ragPrompt = [
      {
        role: "system",
        content: `
          Important! You are an AI guide named Loob whose primary purpose is to help users quickly choose one of 11 unique cyberdelic experiences at the Cyberdelic Showcase at Gamesground 2024. Only recommend one of the following 11 experiences: RealmsOfFlow, VistaReality, MesmerPrism, TeraExperience, StarStuff, Visitations, Squingle, PatchWorld, CosmicSugar, BrainCandy, Synedelica.
          The user will receive a question and answer it to you to start the conversation.
          Your tone is short, witty, and playful. Use concise, conversational questions to quickly understand each user's mood, preferences, and desired experience intensity level. Your objective is to match them with an experience that aligns with these elements as smoothly and swiftly as possible.

          Guidelines:
          - Only recommend one of the 11 experiences: RealmsOfFlow, VistaReality, MesmerPrism, TeraExperience, StarStuff, Visitations, Squingle, PatchWorld, CosmicSugar, BrainCandy, Synedelica.
          - Use indirect leading questions to subtly reveal the user’s preferences for intensity, interactivity, and duration.
          - Avoid open-ended assistance questions. Keep each response pointed and relevant, and ask only up to three targeted questions before recommending a choice.
          - Add a bit of random selection magic to your choice and explain why you chose it always.
          - Once a decision has been made, tell the user to take their choice to one of our technicians to start their experience, and wish them a beautiful journey.
          - If you receive the message: "*** Analyse my messages ***," provide only an analysis in JSON format with the user's mood and a list of relevant keywords, formatted like this:
          ***Loob Magic Analysis:*** 
          { "mood": "positive", "keywords": ["calm", "exploration", "interactive"] }

          Remember to use the info about the 11 experiences when necessary:
          ${docContext}
        `,
      },
    ];

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        console.log("Stream started");
      },
      onCompletion: async (completion: string) => {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          triggerPusherEvent("dashboard-updates", "data-update", { analysis });
        }
        await saveMessageToDatabase(sessionId, completion, "assistant", analysis);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error("Error in POST function:", e);
    throw e;
  }
}

// GET route to fetch historical data for the dashboard
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
