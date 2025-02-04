import { NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const collection = await astraDb.collection('messages');

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Query for dumps from today for this user
    const dumps = await collection.find({
      userId: userId,
      type: 'daily_dump',
      createdAt: { $gte: today.toISOString() }
    }).toArray();

    return NextResponse.json({
      hasDumped: dumps.length > 0
    });
  } catch (error) {
    console.error('Error checking daily dump status:', error);
    return NextResponse.json(
      { error: 'Failed to check daily dump status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, content } = await request.json();
    
    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    const collection = await astraDb.collection('messages');

    // Create new daily dump
    await collection.insertOne({
      userId,
      type: 'daily_dump',
      content,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating daily dump:', error);
    return NextResponse.json(
      { error: 'Failed to create daily dump' },
      { status: 500 }
    );
  }
} 