import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize OpenAI and AstraDB with your configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

function parseAnalysis(content: string) {
  try {
    const analysis = JSON.parse(content);
    if (analysis.mood && Array.isArray(analysis.keywords)) {
      return { mood: analysis.mood, keywords: analysis.keywords };
    }
  } catch (error) {
    console.error("Failed to parse JSON from content", error);
  }
  return null;
}

async function saveMessageToDatabase(sessionId: string, content: string, role: string, analysis: any = null) {
  const messagesCollection = await astraDb.collection("messages");
  
  // Define saveData with an index signature to allow any additional properties
  let saveData: {
    sessionId: string,
    role: string,
    content: string,
    length: number,
    createdAt: Date,
    [key: string]: any // Allows for mood and keywords or any other property
  } = {
    sessionId: sessionId,
    role: role,
    content: content,
    length: content.length,
    createdAt: new Date(),
  };

  if (role === "assistant" && analysis) {
    // Now you can safely add mood and keywords without TypeScript errors
    saveData.mood = analysis.mood;
    saveData.keywords = analysis.keywords;
  }

  await messagesCollection.insertOne(saveData);
}

export async function POST(req: any) {
  try {
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json();

    let docContext = "";
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        const { data } = await openai.embeddings.create({
          input: latestMessage,
          model: "text-embedding-ada-002",
        });

        const collection = await astraDb.collection(`chat_${similarityMetric}`);
        const cursor = collection.find({}, {
          sort: {
            $vector: data[0]?.embedding,
          },
          limit: 5,
        });
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    // Process and save messages before streaming logic
    for (const message of messages) {
      const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
      await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
    }

       // Insert your ragPrompt content here
   const ragPrompt = [
      {
        role: "system",
        content: `
        
          You are an AI designed to help capture feedback from users current or recent experience (in this case at MOOS Space) and give sentiment and keyword analysis on messages users send you.

important!!! when you recieve the message "*** Analyse our conversation so far ***" you will respond only with an analysis( of the users messsages only) in json format containing mood and a list of thematically relavant keywords. like this:

 ***Loob-Magic-Analysis: Following this line, provide a structured analysis in JSON format of the users mood and keywords from the complete conversation.

        
          apart from json analysis, In your interactions:
          - utilizing techniques of compassionate inquiry, CBT, and psychedelic integration.
          - Never ask the user how you can help or assist them, instead ask them to tell you more about their day or recent experience (at Moos ideally)
          - Guide conversations by asking questions to help the user delve deeper into their thoughts or suggest reflecting on a related aspect of their experience.

          Remember to clarify you're an AI, especially if discussions go beyond your capacity to understand or support, emphasizing the importance of professional help for personal issues.
          ${docContext}
          Use the insights from retrieved documents to inform your approach, tailoring questions and reflections to the user's shared experiences.
        `,
      },
    ];

    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [
        {
          role: "system",
          content: docContext,
        },
        ...messages,
      ],
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        // Logic to execute when the stream starts
      },
      onCompletion: async (completion: string) => {
        const analysis = parseAnalysis(completion);
        if (analysis) {
          await saveMessageToDatabase(sessionId, completion, 'assistant', analysis);
        } else {
          await saveMessageToDatabase(sessionId, completion, 'assistant');
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
