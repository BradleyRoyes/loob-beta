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
  // Look for the delimiters and extract the JSON string between them
  const analysisStartMarker = '---Analysis Start---';
  const analysisEndMarker = '---Analysis End---';
  const start = content.indexOf(analysisStartMarker);
  const end = content.indexOf(analysisEndMarker);

  if (start !== -1 && end !== -1) {
    const jsonAnalysis = content.substring(start + analysisStartMarker.length, end).trim();
    try {
      const analysis = JSON.parse(jsonAnalysis);
      const mood = analysis.Mood;
      const keywords = analysis.Keywords;
      return { Mood: mood, Keywords: keywords };
    } catch (error) {
      console.error('Failed to parse JSON analysis', error);
      return null;
    }
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
  Mood: analysis ? analysis.Mood : null,
  Keywords: analysis ? analysis.Keywords : [],
  createdAt: new Date(),
});


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
        First, provide a conversational response to the user's query. After your conversational response, include a line that says '---Analysis Start---'. Following this line, provide a structured analysis in JSON format of the conversation's mood and keywords. Use '---Analysis End---' to signify the end of the JSON analysis."

Example Response from ChatGPT:
"Thank you for sharing your experience. It sounds like you had a challenging day, but it's great to hear you're looking for ways to understand it better.
---Analysis Start---
{
  "Mood": "Reflective",
  "Keywords": ["challenging day", "understand", "better"]
}
---Analysis End---"

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
