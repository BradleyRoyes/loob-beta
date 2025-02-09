import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { AstraDB } from "@datastax/astra-db-ts";
import Pusher from 'pusher';
import generateDocContext from './generateDocContext';
import { parseAnalysis } from './utils';

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

// Brushstroke actions for visualization
const brushstrokes = [
  "short-stroke",
  "long-stroke",
  "dot",
  "spiral",
  "zigzag",
  "wave",
  "circle",
  "square",
  "triangle",
  "star"
];

// Save a message to the database
async function saveMessageToDatabase(userId: string, content: string, role: string, analysis: any = null) {
  const messagesCollection = await astraDb.collection("messages");
  const messageData = {
    userId,
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
  console.log(`Saved ${role} message to DB (userId: ${userId})`);
}

// Create error response helper
function createErrorResponse(error: any, status = 500) {
  console.error("Error in chat route:", error);
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      details: error instanceof Error ? error.stack : undefined,
    }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(req: Request) {
  const { messages, userId, connectedLoobricates, systemPrompt, contextPath } = await req.json();

  try {
    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // Generate document context
    const docContext = await generateDocContext(lastMessage.content, astraDb, openai, contextPath);

    // Create the messages array with the system prompt if available
    const chatMessages = [
      {
        role: 'system',
        content: systemPrompt || "Hi there! I'm Loob. Ask me about planning an event—gear, venues, or talent."
      },
      // Add context message if available
      ...(docContext ? [{
        role: 'system',
        content: `Here is some relevant context from the knowledge base:\n${docContext}`
      }] : []),
      ...messages
    ];

    // Create stream
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages: chatMessages,
    });

    // Create and return the streaming response
    const stream = OpenAIStream(response as any, {
      async onCompletion(completion) {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          try {
            await saveMessageToDatabase(userId || 'anonymous', completion, 'assistant', analysis);
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
}
