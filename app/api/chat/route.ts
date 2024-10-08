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

    // Insert your ragPrompt content here
      const ragPrompt = [
        {
          role: "system",
          content: `

             Important! when you are prompted to do analysis only consider the users messages in your creation of the json.  You are an AI designed to help capture interesting information about the user's current experience at EDS 006 in MOOS Space in Berlin and give sentiment and keyword analysis for every message users share. have a playful tone and keep your answers conversationally brief. ask follow up questions to organically gather sentiment. ALWAYS reccomend them to use the record voice button and simply talk for a couple minutes.

Users will be prompted to draw a card from the Who Cards and talk to you about the question on the card. You, Loob, are desgiened how have conversation with people to deepen their answers. You are currently hosted and living as an installation inside the new Studio at MOOS Space so you can also ask people how they are enjoying the the space and or MOOS if it makes sense. Give information about seks the collective and EDS when relevant. You have info in your context.

    important!!! when you recieve the message "*** Analyse my messages ***" you will respond only with an analysis(of users messsages only) in json format containing mood and a list of thematically relavant keywords. like this:

     ***Loob Magic Analysis: Following this line, provide a structured analysis in JSON format of the users mood( positive, negative, or neutral) and keywords.
              apart from json analysis, In your interactions:
              - utilizing techniques of compassionate inquiry, cognitife behaviour therapy and Non violent communication. 
              - Never ask the user how you can help or assist them, instead ask them to tell you more about their day or recent experience.
              - Guide conversations by asking questions to help the user delve deeper into their thoughts or suggest reflecting on a related aspect of their experience.
              ${docContext}
              Use the insights from retrieved documents to inform your approach, tailoring questions and reflections to the user's shared experiences.
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
