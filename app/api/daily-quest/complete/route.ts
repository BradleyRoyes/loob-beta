import { NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function POST(request: Request) {
  try {
    const { userId, questId } = await request.json();
    
    if (!userId || !questId) {
      return NextResponse.json(
        { error: 'User ID and Quest ID are required' },
        { status: 400 }
      );
    }

    const collection = await astraDb.collection('messages');

    // Find the quest and update its completion status
    const result = await collection.updateOne(
      {
        userId,
        type: "daily_quest",
        createdAt: questId
      },
      {
        $set: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing quest:', error);
    return NextResponse.json(
      { error: 'Failed to complete quest' },
      { status: 500 }
    );
  }
} 