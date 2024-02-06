import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";

// Assuming the `uuid` import is no longer needed as we're using session IDs from headers

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
    let sessionId = req.headers.get("x-session-id") || "fallback-session-id"; // Use a fallback session ID if none provided

    let docContext = '';
    if (useRag && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]?.content;
      // Generate embeddings and retrieve similar documents as before
      const { data } = await openai.embeddings.create({
        input: latestMessage,
        model: 'text-embedding-ada-002',
      });
      const collection = await astraDb.collection(`chat_${similarityMetric}`);
      const documents = await collection.findSimilar({
        embedding: data[0]?.embedding,
        limit: 5,
      });
      docContext = documents.map(doc => doc.content).join("\n");
    }

    // Analyze the conversation with a separate OpenAI call
    const analysisPrompt = `Given the conversation: "${messages.map(m => m.content).join("\n")}", provide a mood rating (1-10), an intensity of the altered state of consciousness rating (1-10), and list relevant keywords related to psychedelic trip reports.`;
    const analysisResponse = await openai.Completion.create({
      model: 'text-davinci-003', // Or any suitable model you intend to use
      prompt: analysisPrompt,
      max_tokens: 1024,
    });
    const analysis = analysisResponse.data.choices[0].text.trim();

    // Assuming a simple structure for analysis parsing - adjust as needed
    let moodRating = "5"; // Default values
    let intensityRating = "5"; // Default values
    let keywords = "psychedelic,transformation"; // Default values
    // You would parse the `analysis` string to extract the actual values

    // Proceed with chat completion and streaming as before
    const response = await openai.Completion.create({
      model: llm || 'gpt-3.5-turbo',
      prompt: [...messages, docContext].join("\n"), // Adjust according to how you wish to combine messages and docContext
      max_tokens: 1024,
      stream: true,
    });

    // Store the analyzed data along with the messages in the AstraDB
    await astraDb.collection("journey_journal").insertOne({
      sessionId,
      messages,
      moodRating,
      intensityRating,
      keywords: keywords.split(','),
      analysisDate: new Date().toISOString(),
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    // Adjust the error handling as per your requirements
    throw e;
  }
}