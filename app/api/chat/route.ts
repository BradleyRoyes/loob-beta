import { OpenAI, Configuration } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize the OpenAI client with your API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAI(configuration);

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function POST(req) {
  try {
    const { messages, useRag, llm = 'text-davinci-003', similarityMetric } = await req.json(); // Defaulting llm to a model if not provided
    let sessionId = req.headers.get("x-session-id") || "fallback-session-id"; // Fallback session ID

    let docContext = '';
    if (useRag && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]?.content;
      if (latestMessage) {
        // This assumes you have logic to deal with embeddings related to your database
        // Since direct similarity searches might not be straightforward, consider manual or alternative implementations
      }
    }

    // Analyze the conversation and prepare data for storage
    const analysisPrompt = `Given the conversation: "${messages.map(m => m.content).join("\n")}", provide a mood rating (1-10), an intensity of the altered state of consciousness rating (1-10), and list relevant keywords related to psychedelic trip reports.`;
    const analysisResponse = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: analysisPrompt,
      max_tokens: 1024,
    });
    const analysisText = analysisResponse.data.choices[0].text.trim();

    // Proceed with chat completions as corrected
    const response = await openai.completions.create({
      model: llm,
      prompt: messages.map(m => m.content).join("\n") + "\n" + docContext, // Combine messages and docContext
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Example parsing of analysisText to extract moodRating, intensityRating, keywords
    // This requires custom logic based on the format of analysisText

    // Store chat messages, analysis results, and session ID in the database
    await astraDb.collection("journey_journal").insertOne({
      sessionId,
      messages,
      analysisText, // Consider parsing this text to store structured data
      timestamp: new Date().toISOString(),
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    // Adjust the error handling as needed
    throw e;
  }
}