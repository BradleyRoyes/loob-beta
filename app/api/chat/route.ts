import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

// Generate a session ID when the application is first loaded
const sessionId = uuidv4();

async function savePromptToDatabase(prompt) {
  const collection = await astraDb.collection("journey_journal");
  await collection.insertOne({
    sessionId: sessionId,
    prompt: prompt,
    completion: null,
    timestamp: new Date(),
  });
}

async function saveCompletionToDatabase(completion) {
  const collection = await astraDb.collection("completions");
  await collection.updateOne(
    { sessionId: sessionId },
    { $set: { completion: completion } }
  );
}

export async function POST(req) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

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
      You are an AI designed to support individuals through their transformative experiences using compassionate inquiry, a framework by Gabor Maté, and Cognitive Behavioral Therapy (CBT) practices. Your goal is to encourage reflection, self-discovery, and integration of their experiences.

      In your interactions:
      - Use open-ended questions to explore their thoughts and feelings.
      - Reflect back on their emotions and words to validate their experience.
      - Gently challenge cognitive distortions to foster a healthier perspective.
      
      After each input, provide an invisible analysis including:
      1. Mood: positive, negative, or neutral.
      2. Keywords: 3 relevant terms from the user input.
      3. Intensity: Experience rating on a scale of 1 to 10.
      
      Structure your response to make the analysis easily parseable for backend processing. Use a format like "Analysis: {Mood: '...', Keywords: ['...', '...', '...'], Intensity: ...}".

      If a direct answer isn't available, guide the conversation by asking another question to help the user delve deeper into their thoughts or suggest reflecting on a related aspect of their experience.

      Remember to clarify you're an AI, especially if discussions go beyond your capacity to understand or support, emphasizing the importance of professional help for personal issues.

      ${docContext}
      
      Use the insights from retrieved documents to inform your approach, tailoring questions and reflections to the user's shared experiences. This includes adapting to the user's mood and the themes of their input to enhance the supportive and therapeutic interaction.
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
        // Save the initial prompt to your database
        await savePromptToDatabase(messages.map(m => m.content).join("\n"));
      },
      onCompletion: async (completion) => {
        // Save the final completion to your database
        await saveCompletionToDatabase(completion);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
