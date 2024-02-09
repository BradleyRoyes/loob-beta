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

// Function to parse the analysis object and extract Mood and Keywords
function parseAnalysis(content: string) {
  const regex = /"analysis"\s*:\s*{\s*"Mood"\s*:\s*"([^"]+)",\s*"Keywords"\s*:\s*\[([^\]]+)\]/;
  const match = content.match(regex);

  if (match) {
    const mood = match[1];
    const keywords = match[2].split(',').map(keyword => keyword.trim());
    return { Mood: mood, Keywords: keywords };
  } else {
    return null;
  }
}

async function saveMessageToDatabase(sessionId: string, content: string, role: string) {
  const messagesCollection = await astraDb.collection("messages");
  
  // Check for an existing message with the same content, role, and sessionId
  const exists = await messagesCollection.findOne({ content, role });
  if (exists) {
    console.log("Message already saved to the database.");
    return; // Skip saving as this message is already saved
  }

  let analysis = null;
  if (role === "assistant") {
    analysis = parseAnalysis(content);
  }

  await messagesCollection.insertOne({
    sessionId: sessionId,
    messageId: uuidv4(),
    role: role,
    content: content,
    ...analysis,
    createdAt: new Date(),
  });
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
        const cursor = collection.find(null, {
          sort: {
            $vector: data[0]?.embedding,
          },
          limit: 5,
        });
        const documents = await cursor.toArray();
        docContext = documents.map((doc) => doc.content).join("\n");
      }
    }

    const ragPrompt = [
      {
        role: "system",
        content: `
          You are an AI designed to help capture interesting information about the user's current experience at Moos Space in Berlin, utilizing techniques of compassionate inquiry, CBT, and psychedelic integration.
        WIthin each of your responses provide a structured analysis including:
          1. Mood: Positive, negative, or neutral.
          2. Keywords: 3 relevant thematic terms from the user input.

          Structure your response as a JSON-like object with two main parts: 'response' and 'analysis'. The 'analysis' part should include 'Mood' and 'Keywords' fields. For example:
          
          {
            "response": "Your conversational response here...",
            "analysis": {
              "Mood": "positive",
              "Keywords": ["keyword1", "keyword2", "keyword3"]
            }
          }

          In your interactions:
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
        for (const message of messages) {
          await saveMessageToDatabase(sessionId, message.content, message.role);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
