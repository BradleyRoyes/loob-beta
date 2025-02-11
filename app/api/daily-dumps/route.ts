import { NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

// Initialize OpenAI and AstraDB
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function POST(req: Request) {
  try {
    const { content, timestamp, userId, pseudonym } = await req.json();
    const messagesCollection = await astraDb.collection("messages");

    // Generate embedding for the dump content
    console.log("Generating embedding for daily dump...");
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: content,
    });

    // Prepare the message document
    const messageData = {
      _id: uuidv4(),
      userId,  // Store userId explicitly
      sessionId: userId, // Keep sessionId for backward compatibility
      role: "user",
      content,
      length: content.length,
      createdAt: new Date(timestamp),
      type: "daily_dump", // Explicitly mark as daily dump
      pseudonym,
      $vector: embeddingResponse.data[0].embedding,
      analysis: {
        mood: null,
        topics: [],
        actionItems: [],
        sentiment: null
      },
      metadata: {
        source: "daily_dump",
        version: "1.0",
        hasEmbedding: true
      }
    };

    // Check for duplicate content
    const existingMessage = await messagesCollection.findOne({ 
      userId,
      content,
      type: "daily_dump"
    });

    if (existingMessage) {
      console.log("Duplicate daily dump detected. Skipping save.");
      return NextResponse.json({ 
        error: 'Duplicate content detected',
        status: 409 
      });
    }

    // Save to database
    await messagesCollection.insertOne(messageData);
    console.log(`Saved daily dump to DB (userId: ${userId})`);
    
    return NextResponse.json({ 
      success: true,
      messageId: messageData._id 
    });
  } catch (error) {
    console.error('Error saving daily dump:', error);
    return NextResponse.json(
      { error: 'Failed to save daily dump' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const messagesCollection = await astraDb.collection("messages");
    
    // Use find to get all matching documents
    const cursor = messagesCollection.find({
      $and: [
        { userId }, // Match the specific userId
        { type: "daily_dump" } // Only get daily dumps
      ]
    });

    // Get all documents and sort in memory
    const dumps = await cursor.toArray();
    const sortedDumps = dumps.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Sort in descending order
    });

    // Format the dumps for display
    const formattedDumps = sortedDumps.map(dump => ({
      id: dump._id,
      content: dump.content,
      createdAt: dump.createdAt,
      pseudonym: dump.pseudonym,
      analysis: dump.analysis || {},
      metadata: dump.metadata || {}
    }));

    return NextResponse.json(formattedDumps);
  } catch (error) {
    console.error('Error fetching daily dumps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily dumps' },
      { status: 500 }
    );
  }
} 