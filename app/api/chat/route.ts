import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function POST(req) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    let sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      sessionId = uuidv4();
      req.headers.set("x-session-id", sessionId);
    }
    let docContext = '';
    if (useRag) {

      const ragPrompt = [
        {
          role: 'system',
          content: `
            You are an AI assistant designed to guide people through their transformative psychedelic trip experiences using compassionate inquiry, a framework developed by Gabor Maté. Engage users by encouraging them to share more about their experiences. Remember, remind the user when necessary that you are just a robot here to help them share and reflect on their experiences.

            After each user input, always provide an analysis of the user's message including:
            1. Mood: positive, negative, or neutral.
            2. A list of 3 relevant or notable keywords from the user input.
            3. An intensity of experience rating from 1 to 10.

            Structure your response as follows (without quotes):
            "Response: [Your response here]"
            "Analysis: {Mood: 'positive/negative/neutral', Keywords: ['keyword1', 'keyword2', 'keyword3'], Intensity: [1-10]}"

            ${docContext}

            If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".
          `,
        },
      ];
    }


      // Your existing logic for handling useRag...
    }

    // Assuming this prepares the prompt for ChatGPT including contextual documents
    const ragPrompt = [...]; // Your existing RAG prompt setup

    for (const message of messages) {
      // Adjusted logic to handle different types of messages
      if (message.type === 'analysis') {
        // Insert analysis data into AstraDB
        const analysisCollection = await astraDb.collection("journey_journal_analysis"); // Assuming you have this collection for analysis data
        await analysisCollection.insertOne({
          sessionId: sessionId,
          ...message.analysis, // Directly spreading the analysis object assuming it contains mood, keywords, intensity
          timestamp: new Date(),
        });
      } else if (message.role === 'user') {
        // Insert user message into the journey_journal collection
        const collection = await astraDb.collection("journey_journal");
        await collection.insertOne({
          ...message,
          sessionId: sessionId,
        });
      }
    }

    // Your existing logic to interact with OpenAI and return a streaming response...
    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: [...ragPrompt, ...messages],
    });
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    throw e;
  }
}
