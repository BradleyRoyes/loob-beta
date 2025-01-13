import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
import { env } from "node:process";
import generateDocContext from "./generateDocContext";
const Pusher = require("pusher");

// Initialize OpenAI and AstraDB
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

// Helper: Parse analysis JSON from assistant content
function parseAnalysis(content: string) {
  const regex =
    /{[\s\S]*?"mood"[\s\S]*?:[\s\S]*?".*?"[\s\S]*?,[\s\S]*?"keywords"[\s\S]*?:[\s\S]*?\[[\s\S]*?\],[\s\S]*?"drink"[\s\S]*?:[\s\S]*?".*?"[\s\S]*?,[\s\S]*?"joinCyberdelicSociety"[\s\S]*?:[\s\S]*?".*?"[\s\S]*?}/;
  const match = content.match(regex);
  if (!match) return null;
  try {
    const analysis = JSON.parse(match[0]);
    if (
      analysis.mood &&
      Array.isArray(analysis.keywords) &&
      (analysis.drink || analysis.drink === "") &&
      (analysis.joinCyberdelicSociety || analysis.joinCyberdelicSociety === "")
    ) {
      return analysis;
    }
  } catch (error) {
    console.error("Failed to parse JSON from content:", error);
  }
  return null;
}

// Save a message to the database
async function saveMessageToDatabase(sessionId: string, content: string, role: string, analysis: any = null) {
  const messagesCollection = await astraDb.collection("messages");
  const existingMessage = await messagesCollection.findOne({ sessionId, content });
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
    drink: analysis?.drink,
    joinCyberdelicSociety: analysis?.joinCyberdelicSociety,
  };
  await messagesCollection.insertOne(messageData);
  console.log(`Saved ${role} message to DB (sessionId: ${sessionId})`);
}

// Brushstroke actions for Pusher
const brushstrokes = [
  "scaleTorus",
  "rotateFaster",
  "changeColor",
  "increaseGloss",
  "addGrowth",
  "makeTransparent",
  "oozeEffect",
  "shinyTumor",
  "adjustLighting",
  "animatePosition",
];

// Main POST function
export async function POST(req: any) {
  try {
    const { messages, useRag, llm, sessionId } = await req.json();
    let docContext = "";

    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        console.log("Generating document context...");
        docContext = await generateDocContext(latestMessage, astraDb, openai);
        console.log("Document context generated:", docContext);
      }
    }

    for (const message of messages) {
      const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }

    const systemPrompt = [
      {
        role: "system",
        content: `
          You are a wise and friendly grandmother-like AI assistant named Loob, designed to help users of a peer-to-peer lending library app.
          
          **Key Goals**:
          1. Listen to user needs with empathy and curiosity.
          2. If the user needs gear, venues, or talent, analyze their request and query the database (Document Context) for relevant listings.
          3. Recommend the most suitable options, explaining why they match the user's request.
          4. If unsure about user requirements, ask clarifying questions to provide better recommendations.

          **Document Context**:
          ${docContext}

          If no relevant listings are found, respond warmly and let the user know you couldn't find anything, but encourage them to try again or refine their request.

          Be conversational, insightful, and engaging, providing value beyond just recommendations.
        `,
      },
    ];

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...systemPrompt, ...messages],
    });

    const stream = OpenAIStream(response, {
      onCompletion: async (completion: string) => {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          console.log("Sending analysis data:", { analysis });
          const randomBrushstroke = brushstrokes[Math.floor(Math.random() * brushstrokes.length)];
          const pusherData = {
            analysis,
            actionName: randomBrushstroke,
            payload: {
              mood: analysis.mood,
              keywords: analysis.keywords,
              brushstroke: randomBrushstroke,
              drink: analysis.drink,
              joinCyberdelicSociety: analysis.joinCyberdelicSociety,
            },
          };
          try {
            await pusher.trigger("my-channel", "my-event", pusherData);
          } catch (err) {
            console.error("Error triggering Pusher event:", err);
          }
        }
        await saveMessageToDatabase(sessionId, completion, "assistant", analysis);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in chatbot route:", error);
    throw error;
  }
}
