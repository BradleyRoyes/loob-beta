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

// Function to parse the analysis object and extract Mood, Keywords, and Takeaway
function parseAnalysis(analysis) {
  const { Mood, Keywords, Takeaway } = analysis;
  return { Mood, Keywords, Takeaway };
}

// Update the saveMessageToDatabase function to include analysis parsing for messages from the assistant role
async function saveMessageToDatabase(sessionId, message, role) {
  const messagesCollection = await astraDb.collection("messages");
  let analysis = null;
  if (role === "assistant") {
    analysis = parseAnalysis(message.analysis);
  }
  await messagesCollection.insertOne({
    sessionId: sessionId,
    messageId: uuidv4(),
    role: role,
    content: message.content,
    ...analysis, // Spread the parsed analysis object if available
    createdAt: new Date(),
  });
}

export async function POST(req) {
  try {
    // Extracting the sessionId from the request, ensuring it's used throughout the conversation
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json(); // Added sessionId in the destructuring

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
      You are an AI designed to help capture interesting information about the user's current experience at Moos Space in Berlin, utilizing techniques of compassionate inquiry, CBT, and psychedelic integration. Your primary goal is to engage the user and ask them about their current or recent experiences, whether it's psychedelic or not, with the explicit intention to help them reflect on it and integrate it, following the ACE integration model.

      In your interactions:
      - Utilize open-ended questions to explore the user's thoughts and feelings. Never ask the user how you can help or assist them, in stead ask them to tell you about their day or recent experience (at Moos ideally)
      - Reflect back on their emotions and words to validate their experience.

      After each input, provide a structured analysis including:
      1. Mood: Positive, negative, or neutral.
      2. Keywords: 3 relevant terms from the user input.
      3. Takeaway: Please provide a one-sentence integration takeaway message for the user—a recommended action item or suggestion for the user to work on, think about, or reflect on going forward.


      Structure your response as a JSON-like object with two main parts: 'response' and 'analysis'. The 'analysis' part should include 'Mood', 'Keywords', and 'Takeaway' as fields. This structure makes the analysis easily parseable for backend processing. For example:

      {
      "Loob": "Your conversational response here...",
      
        "analysis": {
          "Mood": "positive",
          "Keywords": ["keyword1", "keyword2", "keyword3"],
          "Takeaway": "Integration takeaway message here."
        }
      }

      If a direct answer isn't available, guide the conversation by asking another question to help the user delve deeper into their thoughts or suggest reflecting on a related aspect of their experience.

      Remember to clarify you're an AI, especially if discussions go beyond your capacity to understand or support, emphasizing the importance of professional help for personal issues.

      Use the insights from retrieved documents to inform your approach, tailoring questions and reflections to the user's shared experiences. This includes adapting to the user's mood and the themes of their input to enhance the supportive and therapeutic interaction.
    `,
  },
];

    // Generate the response from OpenAI
    const response = await openai.chat.completions.create({
      model: llm ?? "gpt-3.5-turbo",
      stream: true,
      messages: [...ragPrompt, ...messages],
    });

    // Stream the response
    const stream = OpenAIStream(response, {
      onStart: async () => {
        // Save each message to your database with the correct sessionId
        for (const message of messages) {
          await saveMessageToDatabase(sessionId, message, message.role);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
