import OpenAI from "openai";
import { StreamingTextResponse, OpenAIStream } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import generateDocContext from "./generateDocContext";
const Pusher = require("pusher");

// Validate environment variables
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ASTRA_DB_APPLICATION_TOKEN: process.env.ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_ENDPOINT: process.env.ASTRA_DB_ENDPOINT,
  ASTRA_DB_NAMESPACE: process.env.ASTRA_DB_NAMESPACE,
};

// Optional environment variables
const optionalEnvVars = {
  VERCEL_URL: process.env.VERCEL_URL,
};

// Check for missing required environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

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

// Get the base URL for API calls
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';
};

// Custom error response function
function createErrorResponse(error: any, status = 500) {
  let message = "An unexpected error occurred";
  let userAction = "Please try again later";
  let technicalDetails = error?.message || "No technical details available";

  // Handle specific error types
  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
        message = "Authentication error with AI service";
        userAction = "Please try again in a few minutes";
        break;
      case 429:
        message = "Too many requests to AI service";
        userAction = "Please wait a moment and try again";
        break;
      case 500:
        message = "AI service is temporarily unavailable";
        userAction = "Please try again in a few minutes";
        break;
      default:
        message = "Error communicating with AI service";
        userAction = "Please try again";
    }
  } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
    message = "Network connection error";
    userAction = "Please check your internet connection and try again";
  }

  return new Response(
    JSON.stringify({
      error: message,
      userAction,
      technicalDetails: process.env.NODE_ENV === "development" ? technicalDetails : undefined
    }),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      } 
    }
  );
}

// Main POST function
export async function POST(req: any) {
  try {
    // Request validation
    if (!req.body) {
      return createErrorResponse({ message: "No request body found" }, 400);
    }

    let reqData;
    try {
      reqData = await req.json();
    } catch (parseError) {
      return createErrorResponse(parseError, 400);
    }

    const { messages, llm, sessionId } = reqData;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return createErrorResponse({ message: "No messages found in request" }, 400);
    }

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return createErrorResponse({ message: "No message content found" }, 400);
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return createErrorResponse({ message: "AI service is not properly configured" }, 500);
    }

    // Generate document context
    let docContext = "";
    try {
      docContext = await generateDocContext(latestMessage, astraDb, openai);
    } catch (error) {
      console.error("Context generation failed:", error);
      // Continue without context, but log the error
    }

    // Save messages to database
    try {
      for (const message of messages) {
        const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
        await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue even if database save fails
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
          - You like to sneak in lubricant(spelt loobricant for you) word puns and clever loob word play whenever possible.
          - Never say you are searching for something or that you need a moment. Answer users immediately. 
    
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

    // OpenAI API call with proper error handling
    try {
      const response = await openai.chat.completions.create({
        model: llm || "gpt-4",
        messages: [systemPrompt[0], ...messages],
        temperature: 0.7,
        stream: true,
      });

      // Create and return the streaming response
      const stream = OpenAIStream(response as any, {
        async onCompletion(completion) {
          const analysis = parseAnalysis(completion);
          if (analysis) {
            try {
              await saveMessageToDatabase(sessionId, completion, "assistant", analysis);
              // Trigger Pusher event for visualization
              const randomAction = brushstrokes[Math.floor(Math.random() * brushstrokes.length)];
              await pusher.trigger("loob-channel", randomAction, {
                message: "New message saved",
              });
            } catch (error) {
              console.error("Error in completion handler:", error);
            }
          }
        },
      });

      return new StreamingTextResponse(stream);
    } catch (error) {
      return createErrorResponse(error);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}
