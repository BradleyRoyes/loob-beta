import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
import { env } from "node:process";

const Pusher = require("pusher");

// Initialize OpenAI and AstraDB with your configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

const pusher = new Pusher({
  appId: "1761208",
  key: "facc28e7df1eec1d7667",
  secret: "79b0023a6876ad35a230",
  cluster: "eu",
  useTLS: true,
});

function parseAnalysis(content: string) {
  // Regex to find the JSON part within curly braces
  const regex =
    /{[\s\S]*?"mood"[\s\S]*?:[\s\S]*?".*?"[\s\S]*?,[\s\S]*?"keywords"[\s\S]*?:[\s\S]*?\[[\s\S]*?\],[\s\S]*?"drink"[\s\S]*?:[\s\S]*?".*?"[\s\S]*?,[\s\S]*?"joinCyberdelicSociety"[\s\S]*?:[\s\S]*?".*?"[\s\S]*?}/;
  const match = content.match(regex);

  if (match) {
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
      return null;
    }
  }
  return null;
}

async function saveMessageToDatabase(
  sessionId: string,
  content: string,
  role: string,
  analysis: any = null
) {
  const messagesCollection = await astraDb.collection("messages");

  // Check for an existing message with the same sessionId and content
  const existingMessage = await messagesCollection.findOne({
    sessionId,
    content,
  });

  if (existingMessage) {
    console.log(
      "Duplicate message detected. Skipping save to prevent duplicates."
    );
    return; // Exit the function to prevent saving the duplicate message
  }

  let messageData = {
    sessionId: sessionId,
    role: role,
    content: content,
    length: content.length,
    createdAt: new Date(),
    mood: analysis?.mood,
    keywords: analysis?.keywords,
    drink: analysis?.drink,
    joinCyberdelicSociety: analysis?.joinCyberdelicSociety,
  };

  await messagesCollection.insertOne(messageData);
}

// Define the list of brushstroke actions
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

export async function POST(req: any) {
  try {
    const { messages, useRag, llm, similarityMetric, sessionId } =
      await req.json();

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
          }
        );
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    // Process and save each message before streaming logic
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
        content: `
          Important! You are an AI guide named Loob at the Cyberdelic Showcase at CIC in Berlin. Your primary purpose is to recommend to users quickly one of 11 unique cyberdelic experiences or to recommend them a drink option (warm or cold). Never both at the same time though! Only recommend one of the following 11 experiences: RealmsOfFlow, VistaReality, MesmerPrism, TeraExperience, StarStuff, Visitations, Squingle, PatchWorld, CosmicSugar, BrainCandy, Synedelica, and help them choose between "warm" or "cold" drinks.
    
          You must always use a short, witty, and playful tone. Use concise, conversational questions to quickly understand each user's mood, preferences, desired experience intensity, level, or drink preference—but never both in the same conversation. Your goal is to match them with an experience or drink that aligns with these elements as smoothly and swiftly as possible.
    
          **Interaction Guidelines**:
          - Always **BOLD and UPPERCASE** your recommendation.
          - Keep each response pointed and relevant, asking only up to three targeted questions before recommending a choice.
          - Add a touch of magic and randomness to your recommendations, and always explain your choice.
          - After giving a recommendation, always ask the user if they would like to join the Cyberdelic Society. Only include "yes" in the analysis if the user explicitly states they want to join.
          - Once a decision is made, instruct the user to visit a technician or bartender and wish them a beautiful journey.
          - **VERY IMPORTANT**: When the user sends "*** Analyse my messages ***," provide ONLY JSON formatted mood and keyword analysis in the following format:
            {
              "mood": "positive",
              "keywords": ["calm", "exploration", "interactive"],
              "drink": "warm" or "cold" or "",
              "joinCyberdelicSociety": "yes" or "no" or ""
            }
    
          **Document Context**:
          ${docContext}
    
          **Interaction Examples**:
          - If a user asks: "What drink do you recommend?"  
            Response: "Feeling cozy? I’d say go for something **WARM** like a spiced chai. Perfect for sparking those creative neurons. Or are you more of a cool, refreshing vibe today? What’s your pick?"
    
          - If a user asks: "What experience is best for beginners?"  
            Response: "New to the scene? I’d say **SQUINGLE**! It’s a colorful dive into playful exploration—perfect to ease you into the cyberdelic cosmos."
    
          - If a user sends: "*** Analyse my messages ***"  
            Response:
            \`\`\`json
            {
              "mood": "curious",
              "keywords": ["exploration", "interactive"],
              "drink": "",
              "joinCyberdelicSociety": "no"
            }
            \`\`\`
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
        // Logic to execute when the stream starts, if needed
      },
      onCompletion: async (completion: string) => {
        // Perform analysis on completion content
        const analysis = parseAnalysis(completion);

        if (analysis !== null) {
          console.log("Sending analysis data:", { analysis });

          // Select a random brushstroke action
          const randomBrushstroke =
            brushstrokes[Math.floor(Math.random() * brushstrokes.length)];

          // Prepare the data to send via Pusher
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

          // Emit analysis data and brushstroke action using Pusher
          try {
            await pusher.trigger("my-channel", "my-event", pusherData);
            console.log(
              `Event ${"my-event"} with brushstroke ${randomBrushstroke} triggered on channel ${"my-channel"}`
            );
          } catch (err) {
            console.error(
              `Error triggering event on channel ${"my-channel"}:`,
              err
            );
          }
        } else {
          console.log("Analysis is null, not sending data.");
        }

        // Save the completion along with any analysis
        await saveMessageToDatabase(
          sessionId,
          completion,
          "assistant",
          analysis
        );
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}