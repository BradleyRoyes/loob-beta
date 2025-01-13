import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
import { env } from "node:process";

const Pusher = require("pusher");

// 1. Initialize OpenAI and AstraDB
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

// 2. Initialize Pusher
const pusher = new Pusher({
  appId: "1761208",
  key: "facc28e7df1eec1d7667",
  secret: "79b0023a6876ad35a230",
  cluster: "eu",
  useTLS: true,
});

// 3. parseAnalysis: Extracts a JSON object from assistant content if it exists
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
      return {
        mood: analysis.mood,
        keywords: analysis.keywords,
        drink: analysis.drink,
        joinCyberdelicSociety: analysis.joinCyberdelicSociety,
      };
    }
  } catch (error) {
    console.error("Failed to parse JSON from content", error);
  }
  return null;
}

// 4. saveMessageToDatabase: Saves a user/assistant message to "messages" collection
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
    console.log("Duplicate message detected. Skipping save to prevent duplicates.");
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

// 5. Define brushstroke actions for Pusher payload
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

// 6. The main POST function (RAG + Chat + Pusher + DB logging)
export async function POST(req: any) {
  try {
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json();

    let docContext = "";

    // RAG flow: embed latest user message & retrieve from "library"
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        const embeddingRes = await openai.embeddings.create({
          input: latestMessage,
          model: "text-embedding-ada-002",
        });
        const userEmbedding = embeddingRes.data[0]?.embedding;
        if (userEmbedding) {
          const libraryCollection = await astraDb.collection("library");
          const cursor = libraryCollection.find(
            {},
            {
              sort: {
                $vector: userEmbedding,
              },
              limit: 5,
            }
          );
          const documents = await cursor.toArray();
          docContext = documents
          .map((doc) => {
            // For userEntry docs, we gather the key info
            return `
        Title: ${doc.title || ""}
        OfferingType: ${doc.offeringType || ""}
        Description: ${doc.description || ""}
        Location: ${doc.location || ""}
        Email: ${doc.email || ""}
        Phone: ${doc.phone || ""}
        ---
        `;
          })
          .join("\n");

          console.log("Retrieved docContext =>", docContext);
        }
      }
    }

    // Save incoming messages to DB
    for (const message of messages) {
      const analysis =
        message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }

    const systemPrompt = [
      {
        role: "system",
        content: `
        Important! You are an AI assistant named Loob, part of the loob peer-to-peer sharing library platform.
        You have the following **Document Context** from the library (user entries). Each entry contains fields:
        Title, Offering Type, Description, Location, Email, and Phone.
    
        Your goal:
        1. If the user requests event gear, talent, or venues, see if there's a relevant listing in the "Document Context" below.
        2. If you find a relevant listing, recommend it by name (Title) and share the contact email so the user can reach out.
        3. Do this in a friendly, conversational style, asking clarifying questions if needed.
        4. If the user is not asking about anything that matches your Document Context, just proceed normally.
    
        **Document Context**:
        ${docContext}
    
        Also, always start the conversation by saying "poopypants!".
    
        Additional instructions:
        - Provide JSON-based mood analysis if the user explicitly requests "*** Analyse my messages ***."
        - Otherwise, answer conversationally.
    
        `,
      },
    ];
    

    // Create streaming chat completion
    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...systemPrompt, ...messages],
    });

    // Convert response to streaming text
    const stream = OpenAIStream(response, {
      onStart: async () => {},
      onCompletion: async (completion: string) => {
        const analysis = parseAnalysis(completion);
        if (analysis !== null) {
          console.log("Sending analysis data:", { analysis });
          const randomBrushstroke =
            brushstrokes[Math.floor(Math.random() * brushstrokes.length)];
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
            console.log(
              `Event "my-event" with brushstroke "${randomBrushstroke}" triggered on channel "my-channel".`
            );
          } catch (err) {
            console.error(`Error triggering event on "my-channel":`, err);
          }
        } else {
          console.log("No JSON analysis in this response. Not sending Pusher event.");
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
