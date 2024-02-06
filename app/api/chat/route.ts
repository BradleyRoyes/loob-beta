import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";

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
    let sessionId = req.headers.get("x-session-id") || "fallback-session-id";

    let docContext = '';
    if (useRag && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        // Assuming embedding generation and subsequent retrieval of documents based on those embeddings
        const { data } = await openai.embeddings.create({
          input: latestMessage,
          model: 'text-embedding-ada-002',
        });
        // You will need to implement logic to find documents based on embeddings here.
        // This could involve querying your database with criteria relevant to the embeddings.
        // Since `findSimilar` is not available, you'll likely need a custom implementation.
      }
    }

    // Proceed with chat completions as before
    const response = await openai.Completion.create({
      model: llm || 'gpt-3.5-turbo',
      prompt: messages.map(m => m.content).join("\n") + "\n" + docContext, // Combine messages and docContext
      max_tokens: 1024,
      n: 1,
      stop: null,
      temperature: 0.5,
    });

    const analysisPrompt = `Given the conversation: "${messages.map(m => m.content).join("\n")}", provide a mood rating (1-10), an intensity of the altered state of consciousness rating (1-10), and list relevant keywords related to psychedelic trip reports.`;
    const analysisResponse = await openai.Completion.create({
      model: 'text-davinci-003', // Adjust model as needed
      prompt: analysisPrompt,
      max_tokens: 1024,
    });
    const analysis = analysisResponse.data.choices[0].text.trim();
    // Parse the analysis result as needed to extract moodRating, intensityRating, keywords

    // Store chat messages and analysis results in the database
    await astraDb.collection("journey_journal").insertOne({
      sessionId,
      messages,
      analysis, // Include full analysis string or parsed fields
      timestamp: new Date().toISOString(),
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
