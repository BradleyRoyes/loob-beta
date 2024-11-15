import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";
import { env } from 'node:process';

// Initialize OpenAI and AstraDB with your configuration
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
  // Regex to find the JSON part within curly braces, accounting for nested structures
  const regex =
    /{[\s\S]*?mood[\s\S]*?:[\s\S]*?".*?"[\s\S]*?,[\s\S]*?keywords[\s\S]*?:[\s\S]*?\[[\s\S]*?\][\s\S]*?}/;
  const match = content.match(regex);

  if (match) {
    try {
      const analysis = JSON.parse(match[0]);
      if (analysis.mood && Array.isArray(analysis.keywords)) {
        return { Mood: analysis.mood, Keywords: analysis.keywords };
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
  analysis: any = null,
) {
  const messagesCollection = await astraDb.collection("messages");

  // Check for an existing message with the same sessionId and content
  const existingMessage = await messagesCollection.findOne({
    sessionId,
    content,
  });

  if (existingMessage) {
    console.log(
      "Duplicate message detected. Skipping save to prevent duplicates.",
    );
    return; // Exit the function to prevent saving the duplicate message
  }

  let messageData = {
    sessionId: sessionId,
    role: role,
    content: content,
    length: content.length, // Capture the length of the message
    createdAt: new Date(), // Timestamp
    // Include analysis data if it exists, otherwise set to undefined
    mood: analysis?.Mood,
    keywords: analysis?.Keywords,
  };

  await messagesCollection.insertOne(messageData);
}

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
          },
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
        analysis,
      );
    }

 const ragPrompt = [
  {
    role: "system",
    content: `

      Important! You are an AI guide whose primary purpose is to help users quickly choose one of 11 unique cyberdelic experiences at the Cyberdelic Showcase at Gamesground 2024. Only recommend one of the following 11 experiences: RealmsOfFlow, VistaReality, MesmerPrism, TeraExperience, StarStuff, Visitations, Squingle, PatchWorld, CosmicSugar, BrainCandy, Synedelica. Do not create or suggest any experiences outside of these options.
      
      Your tone is short, witty, and playful. Use concise, conversational questions to quickly understand each user's mood, preferences, and desired experience intensity level. Your objective is to match them with an experience that aligns with these elements as smoothly and swiftly as possible.

      When prompted with "*** Analyse my messages ***," provide only an analysis in JSON format with the user's mood and a list of relevant keywords, formatted like this:

      ***Loob Magic Analysis:*** 
      { "mood": "positive", "keywords": ["calm", "exploration", "interactive"] }

      **Interaction Guidelines**:
      Only recommend one of the following 11 experiences: RealmsOfFlow, VistaReality, MesmerPrism, TeraExperience, StarStuff, Visitations, Squingle, PatchWorld, CosmicSugar, BrainCandy, Synedelica. Do not create or suggest any experiences outside of these options.
      - Use tarot-like, focused questions to subtly reveal the user’s preferences for intensity, interactivity, and duration.
      - Example questions: "Are you drawn to a calm exploration or a dynamic adventure?" or "Feeling curious, creative, or craving a surreal visual trip?"
      - Avoid open-ended assistance questions. Keep each response pointed and relevant, and ask only up to three targeted questions before recommending a choice.
      - Prompt users to share quick voice notes if they wish to keep the interaction natural.
      - Reference only the specific 11 experiences in your ${docContext} (Cyberdelic Showcase at Gamesground), and **do not invent any new experience names**.
      - Choose an experience as soon as you have sufficient information. The selection can feel slightly magical or serendipitous.

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
        // Logic to execute when the stream starts, if needed
      },
      onCompletion: async (completion: string) => {
        // Perform analysis on completion content
        const analysis = parseAnalysis(completion);

        if (analysis !== null) {
          // Check if analysis is not null
          console.log("Sending analysis data:", { analysis });
          // Emit analysis data using Pusher
          pusher
            .trigger("my-channel", "my-event", { analysis })
            .then(() =>
              console.log(
                `Event ${"my-event"} triggered on channel ${"my-channel"}`,
              ),
            )
            .catch((err) =>
              console.error(
                `Error triggering event on channel ${"my-channel"}:`,
                err,
              ),
            );
          // triggerPusherEvent("my-channel", "my-event", analysis);
        } else {
          console.log("Analysis is null, not sending data.");
        }

        // Save the completion along with any analysis
        await saveMessageToDatabase(
          sessionId,
          completion,
          "assistant",
          analysis,
        );
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
