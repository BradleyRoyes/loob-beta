import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid'; // Assuming you're using UUID for session ID generation

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

export async function POST(req: Request) {
  try {
    const { messages, useRag, llm, similarityMetric } = await req.json();

    // Generate a unique session ID using UUID
    const sessionId = uuidv4();

    let docContext = '';
    if (useRag) {
      const latestMessage = messages[messages.length - 1]?.content;
      const { data } = await openai.embeddings.create({ input: latestMessage, model: 'text-embedding-ada-002' });
      const collection = await astraDb.collection(`chat_${similarityMetric}`);
      const cursor = collection.find(null, {
        sort: {
          $vector: data[0]?.embedding,
        },
        limit: 5,
      });
      const documents = await cursor.toArray();
      docContext = documents.map(doc => doc.content).join("\n");
    }

    // Process chat response as before
    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: messages,
    });

    // Separate call to ChatGPT for analysis - not returned to the user
    const analysisPrompt = `Given the conversation: "${messages.map(m => m.content).join("\n")}", provide a mood rating (1-10), an intensity of the altered state of consciousness rating (1-10), and list relevant keywords related to psychedelic trip reports.`;
    const analysisResponse = await openai.createCompletion({
      model: 'text-davinci-003', // Use an appropriate model for analysis
      prompt: analysisPrompt,
      max_tokens: 1024,
    });
    const analysisText = analysisResponse.data.choices[0].text.trim();
    // Example parsing logic - adjust based on actual response formatting
    const [moodRating, intensityRating, keywords] = analysisText.split('\n').map(line => line.split(': ')[1]);

    // Store analysis results and messages in the database with the generated sessionId
    await astraDb.collection("journey_journal").insertOne({
      sessionId,
      messages: messages.map(m => ({ ...m, timestamp: new Date().toISOString() })),
      moodRating,
      intensityRating,
      keywords: keywords.split(', '),
      analysisDate: new Date().toISOString(),
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}