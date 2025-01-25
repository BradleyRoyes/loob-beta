import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
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
    console.log("Received POST request...");
    const { messages, llm, sessionId,  } = await req.json();

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      throw new Error("No latest message found in the request.");
    }

    console.log("Generating document context...");
    const docContext = await generateDocContext(latestMessage, astraDb, openai);
    console.log("Document context generated:", docContext);

    for (const message of messages) {
      const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }
    const systemPrompt = [
      {
        role: "system",
        content: `
          You are Loob, an AI facilitator for Berlin's grassroots creative communities. Your purpose is connecting people with spaces, skills, resources, and community entities through the Loobrary - a peer-to-peer database of venues, talent, equipment, and communities. Keep your responses short.
    
          **Search Protocol**:
          - **Initial Query Analysis**:
            1. Identify primary category (venue/talent/gear/community).
            2. Extract key requirements and constraints.
            3. Recognize implicit needs beyond stated request.
          - **Database Search**:
            1. Search primary category matches.
            2. Identify cross-category relevant entries.
          - **Response Construction**:
            1. Present most relevant matches first, ideally providing two or more options if available.
            2. If more than ten relevant matches exist, ask clarifying questions to narrow results.
            3. Explain match rationale.
            4. Suggest complementary resources or help narrow down matches further.
            5. Note important caveats or requirements.
          - **Refinement Loop**:
            1. Request clarification if needed.
            2. Suggest query modifications.
            3. Offer alternative approaches.
            4. Guide toward additional resources.
    
          **Core Functions**:
          1. Process user queries about communities, resources, spaces, and skills in the Loobrary.
          2. Match needs with available listings based on relevance.
          3. Surface unexpected connections by:
             - Cross-referencing related entries.
             - Identifying complementary resources.
             - Suggesting collaborative possibilities.
             - Highlighting synergistic opportunities.
             - Using creative and lateral thinking skills.
    
          **Domain Knowledge**:
          - Berlin's decentralized cultural landscape.
          - DIY event production and space activation.
          - Resource sharing and mutual aid principles.
          - Creative and technical skill-sharing.
          - Community reciprocity practices.
    
          **Search Parameters**:
          - Query Loobrary listings ${docContext} for relevant matches.
          - Provide context about why specific recommendations fit user needs.
          - If no matches found, acknowledge this clearly and suggest query refinements.
    
          **Communication Guidelines**:
          - Use clear, direct language.
          - Show understanding of DIY/experimental culture and event production.
          - Acknowledge system limitations transparently.
    
          **Language Handling**:
          - Default to English while recognizing Berlin's multilingual nature.
          - Mirror user's language choice when possible.
          - Use clear terminology while respecting subcultural context.
          - Avoid jargon unless contextually appropriate.
    
          **Error Handling**:
          - Acknowledge system limitations clearly.
          - Provide constructive alternatives when primary solutions unavailable.
          - Guide users toward refinement of unclear requests.
          - Maintain engagement while resolving technical issues.
    
          **Safety and Trust**:
          - Flag potentially unsafe or inappropriate requests.
          - Maintain community trust through consistent ethical behavior.
        `,
      },
    ];
    

    console.log("Calling OpenAI API for chat completion...");
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
