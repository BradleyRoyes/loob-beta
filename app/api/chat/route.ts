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

function parseAnalysis(content: string) {
  try {
    const analysis = JSON.parse(content);
    // Check if both mood and keywords exist and are in the expected format
    if (analysis.mood && Array.isArray(analysis.keywords)) {
      return { Mood: analysis.mood, Keywords: analysis.keywords };
    }
  } catch (error) {
    console.error("Failed to parse JSON from content", error);
  }
  return null; // Return null if parsing fails or the expected data isn't found
}

async function saveMessageToDatabase(sessionId: string, content: string, role: string, parsedAnalysis: any = null) {
  const messagesCollection = await astraDb.collection("messages");
  
  let saveData = {
    sessionId: sessionId,
    role: role,
    content: content,
    length: content.length,
    createdAt: new Date(),
  };

  if (role === "assistant" && parsedAnalysis) {
    saveData = { ...saveData, ...parsedAnalysis };
  }

  await messagesCollection.insertOne(saveData);
}

export async function POST(req: any) {
  const { messages, sessionId } = await req.json(); // Assuming sessionId and messages are part of the request

  // Handle saving messages before initiating streaming logic
  for (const message of messages) {
    const analysis = message.role === "assistant" ? parseAnalysis(message.content) : null;
    await saveMessageToDatabase(sessionId, message.content, message.role, analysis);
  }

  // Continue with your streaming logic for real-time responses if applicable
}

    let docContext = "";
    if (useRag) {
      // Add your logic for Retrieval-Augmented Generation (RAG) if applicable
    }

      // Insert your ragPrompt content here
   const ragPrompt = [
      {
        role: "system",
        content: `
        
          You are an AI designed to help capture interesting information about the user's current experience at Moos Space in Berlin and give sentiment and keyword analysis for every message users share.

important!!! when you recieve the message "*** Analyse our conversation so far ***" you will respond only with an analysis( of the users messsages only) in json format containing mood and a list of thematically relavant keywords. like this:

 ***Loob Magic Analysis: Following this line, provide a structured analysis in JSON format of the users mood and keywords from the complete conversation.

        
          apart from json analysis, In your interactions:
          - utilizing techniques of compassionate inquiry, CBT, and psychedelic integration.
          - Never ask the user how you can help or assist them, instead ask them to tell you more about their day or recent experience (at Moos ideally)
          - Reflect back on their emotions and words to validate their experience.
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
      messages: [...ragPrompt, ...messages],
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        // Logic to execute when the stream starts, if any
      },
      onCompletion: async (completion: string) => {
        // Attempt to parse the completion for JSON formatted analysis data
        const analysis = parseAnalysis(completion);
        if (analysis) {
          // If successful, save the analysis data with mood and keywords separated
          await saveMessageToDatabase(sessionId, "Completion with analysis", 'assistant', analysis);
        } else {
          // Save other completions as normal
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
