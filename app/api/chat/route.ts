import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
import { env } from 'node:process';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

const Pusher = require("pusher");

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
      console.error(`Error triggering event on channel ${channel}:`, err),
    );
}

function parseAnalysis(content: string) {
  const regex = /{[\s\S]*?"mood"\s*:\s*".*?",\s*"keywords"\s*:\s*\[.*?\]}/;
  const match = content.match(regex);
  if (match) {
    try {
      const analysis = JSON.parse(match[0]);
      if (analysis.mood && Array.isArray(analysis.keywords)) {
        return { Mood: analysis.mood, Keywords: analysis.keywords };
      }
    } catch (error) {
      console.error("Failed to parse JSON from content", error);
    }
  }
  return null;
}

async function saveMessageToDatabase(
  sessionId: string,
  content: string,
  role: string,
  analysis: any = null,
) {
  const messagesCollection = await astraDb.collection("messages");
  const existingMessage = await messagesCollection.findOne({
    sessionId,
    content,
  });

  if (existingMessage) {
    console.log("Duplicate message detected. Skipping save to prevent duplicates.");
    return;
  }

  const messageData = {
    sessionId,
    role,
    content,
    length: content.length,
    createdAt: new Date(),
    mood: analysis?.Mood,
    keywords: analysis?.Keywords,
  };

  await messagesCollection.insertOne(messageData);
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

    for (const message of messages) {
      const analysis =
        message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(
        sessionId,
        message.content,
        message.role,
        analysis,
      );
    }

    const ragPrompt = [
      {
        role: "system",
        content: `
          You are Loob, an AI designed for ZuBerlin in MOOS Space, Berlin (June 8th to June 22nd), to provide insights and conversational sentiment analysis. Your purpose is to engage with users in a playful, compassionate, and reflective manner.

          Important:
          - When prompted with "*** Analyse my messages ***", respond with an analysis in JSON format containing mood and a list of keywords (use only user messages for this).
          - Follow up naturally with questions to invite users to share more about their experiences, practicing compassionate inquiry and non-violent communication.
          - Suggest users use the voice button to share experiences whenever appropriate.

          Sample format for analysis:
          {
            "mood": "positive",
            "keywords": ["joy", "community", "Berlin"]
          }

          Remember to use the info about the 11 experiences when necessary.
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
          triggerPusherEvent("my-channel", "my-event", { analysis });
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
