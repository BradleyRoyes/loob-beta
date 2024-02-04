// Import necessary libraries
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { v4 as uuidv4 } from 'uuid'; // UUID for generating unique session identifiers

// Initialize OpenAI and AstraDB with your API keys and configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

// Define the POST function for handling incoming requests
export async function POST(req: Request) {
  try {
    // Parse the request body to get conversation details and session information
    const { messages, useRag, llm, similarityMetric, sessionId } = await req.json();

    // Generate or reuse the session identifier
    const sessionIdentifier = sessionId || uuidv4();

    const latestMessage = messages[messages?.length - 1]?.content;

    // Initialize document context variable
    let docContext = '';
    if (useRag) {
      // If using RAG, create embeddings and fetch related documents for context
      const {data} = await openai.embeddings.create({input: latestMessage, model: 'text-embedding-ada-002'});
      const collection = await astraDb.collection(`chat_${similarityMetric}`);
      const cursor = collection.find(null, { sort: { $vector: data[0]?.embedding }, limit: 5 });
      const documents = await cursor.toArray();
      docContext = `START CONTEXT\n${documents?.map(doc => doc.content).join("\n")}\nEND CONTEXT`;
    }

    // Compose the RAG prompt with document context
    const ragPrompt = [{
      role: 'system',
      content: `You are an AI assistant answering questions about Cassandra and Astra DB. Format responses using markdown where applicable.\n${docContext}\nIf the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".`,
    }];

    // Generate the chatbot response using OpenAI
    const response = await openai.chat.completions.create({
      model: llm ?? 'gpt-3.5-turbo',
      stream: true,
      messages: [...ragPrompt, ...messages],
    });
    const stream = OpenAIStream(response);

    // Store or update the conversation in the 'journey_journals' collection
    const journalsCollection = await astraDb.collection('journey_journals');
    await journalsCollection.updateOne(
      { sessionIdentifier: sessionIdentifier },
      { $push: { messages: { $each: messages } }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // Return the session identifier along with the chatbot response
    return new StreamingTextResponse(stream, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIdentifier: sessionIdentifier })
    });
  } catch (e) {
    // Handle any errors that occur during the request handling
    return new Response("Error: " + e.toString(), { status: 500 });
  }
}
