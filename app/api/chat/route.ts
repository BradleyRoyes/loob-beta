import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
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
async function saveMessageToDatabase(sessionId: string, content: string, role: string, userId?: string, analysis: any = null) {
  try {
    const messagesCollection = await astraDb.collection("messages");
    const existingMessage = await messagesCollection.findOne({ sessionId, content });
    if (existingMessage) {
      console.log("Duplicate message detected. Skipping save.");
      return;
    }
    const messageData = {
      sessionId,
      userId,
      role,
      content,
      length: content.length,
      createdAt: new Date(),
      type: 'chat_message',
      mood: analysis?.mood,
      keywords: analysis?.keywords,
      analysis: analysis ? {
        mood: analysis.mood,
        keywords: analysis.keywords,
        raw: analysis
      } : null
    };
    await messagesCollection.insertOne(messageData);
    console.log(`Saved ${role} message to DB (sessionId: ${sessionId}, userId: ${userId || 'anonymous'})`);
  } catch (error) {
    console.error("Error saving message to database:", error);
    // Don't throw the error - we want to continue even if DB save fails
  }
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

// Main POST function
export async function POST(req: any) {
  console.log("🚀 Starting chat request processing...");
  try {
    const { messages, llm, sessionId, userId } = await req.json();
    console.log("📝 Request details:", {
      messageCount: messages.length,
      model: llm ?? "gpt-3.5-turbo",
      sessionId,
      userId,
      lastMessagePreview: messages[messages.length - 1]?.content?.substring(0, 100) + "..."
    });

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      console.error("❌ No latest message found in request");
      throw new Error("No latest message found in the request.");
    }

    console.log("🔍 Generating document context...");
    let docContext;
    try {
      docContext = await generateDocContext(latestMessage, astraDb, openai);
      console.log("✅ Document context generated:", {
        contextLength: docContext?.length,
        preview: docContext?.substring(0, 100) + "..."
      });
    } catch (error) {
      console.error("⚠️ Error generating document context:", {
        error,
        fallback: "Continuing without context"
      });
      docContext = "";
    }

    // Save user messages to database
    console.log("💾 Saving user messages to database...");
    for (const message of messages) {
      if (message.role === 'user') {
        await saveMessageToDatabase(sessionId, message.content, message.role, userId);
      }
    }
    console.log("✅ User messages saved successfully");

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

    console.log("🤖 Preparing OpenAI API call...", {
      totalMessages: systemPrompt.length + messages.length,
      model: llm ?? "gpt-3.5-turbo"
    });

    try {
      console.log("📡 Initiating OpenAI stream...");
      const response = await openai.chat.completions.create({
        model: llm ?? "gpt-3.5-turbo",
        stream: true,
        messages: [...systemPrompt, ...messages],
      });
      console.log("✅ OpenAI stream created successfully");

      let accumulatedMessage = '';
      console.log("🔄 Setting up message stream processing...");

      const stream = OpenAIStream(response as any, {
        async onCompletion(completion: string) {
          console.log("📨 Message completion received:", {
            length: completion.length,
            preview: completion.substring(0, 100) + "..."
          });
          
          accumulatedMessage = completion;
          const analysis = parseAnalysis(completion);
          
          if (analysis) {
            console.log("🎨 Analysis data extracted:", {
              mood: analysis.mood,
              keywordCount: analysis?.keywords?.length,
              drink: analysis.drink
            });
            
            const randomBrushstroke = brushstrokes[Math.floor(Math.random() * brushstrokes.length)];
            try {
              console.log("📤 Triggering Pusher event...");
              await pusher.trigger("my-channel", "my-event", {
                analysis,
                actionName: randomBrushstroke,
                payload: {
                  mood: analysis.mood,
                  keywords: analysis.keywords,
                  brushstroke: randomBrushstroke,
                  drink: analysis.drink,
                  joinCyberdelicSociety: analysis.joinCyberdelicSociety,
                },
              });
              console.log("✅ Pusher event sent successfully");
            } catch (err) {
              console.error("❌ Error triggering Pusher event:", {
                error: err,
                errorMessage: err.message,
                stack: err.stack
              });
            }
          } else {
            console.log("ℹ️ No analysis data found in completion");
          }

          console.log("💾 Saving assistant message to database...");
          await saveMessageToDatabase(sessionId, completion, "assistant", userId, analysis);
          console.log("✅ Assistant message saved successfully");
        },
        onFinal(completion: string) {
          console.log("🏁 Stream completed:", {
            finalMessageLength: completion.length,
            timestamp: new Date().toISOString()
          });
        },
      });

      console.log("🔄 Returning streaming response...");
      return new StreamingTextResponse(stream);
    } catch (error: any) {
      console.error("❌ OpenAI API Error:", {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({
          error: "OpenAI API Error",
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        }),
        { 
          status: error.status || 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error("❌ Fatal Error in chat route:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || "An unexpected error occurred",
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
