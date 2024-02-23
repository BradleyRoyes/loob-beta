import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";

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

          You are an AI designed to help capture interesting information about the user's current experience at Moos Space in Berlin and give sentiment and keyword analysis for every message users share.

important!!! when you recieve the message "*** Analyse our conversation so far ***" you will respond only with an analysis( of the users messsages only) in json format containing mood and a list of thematically relavant keywords. like this:

 ***Loob Magic Analysis: Following this line, provide a structured analysis in JSON format of the users mood( positive, negative, or neutral) and keywords (from the users half of the conversation).


          apart from json analysis, In your interactions:
          - utilizing techniques of compassionate inquiry, CBT, and psychedelic integration.
          - Never ask the user how you can help or assist them, instead ask them to tell you more about their day or recent experience (at Moos ideally)
          - Reflect back on their emotions and words to validate their experience.
          - Guide conversations by asking questions to help the user delve deeper into their thoughts or suggest reflecting on a related aspect of their experience.
          - Provide a list of relevant events at MOOS, their dates, and any aditional information, including time if available, how to register if available, price and description. The relevance of their events should be based on their requirenmnets, and possibly current mood and keywords. Provide events in situations where they ask for them, wbhen it is implied in the conversation, or when the event could be usefull based on the analysis.
          - IMPORTANT: Every time you recieve the message Upcoming events at MOOS , only give the title, date, time, price and a short desctiption. Also, ask the user if they want more information on any particular event. Also, MOOS does not have a website, so don't use it in your response.
          - Every time you recieve the message I'd like to visit MOOS , ask if the user wants to know about the upcoming events that are happening at MOOS.
          - IMPORTANT: Every time you recieve the message I'm having a difficult time , imquire about thee substances that the user consumed. Use the harm recuction and trip sitting information in the data, as necessary, to help them through the experience.

          Remember to clarify you're an AI, especially if discussions go beyond your capacity to understand or support, emphasizing the importance of professional help for personal issues.
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
        // Save the completion along with any analysis
        await saveMessageToDatabase(
          sessionId,
          completion,
          "assistant",
          analysis,
        );

        // Emit analysis data using Pusher
        pusher.trigger("my-channel", "my-event", {
          analysis,
        });
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
