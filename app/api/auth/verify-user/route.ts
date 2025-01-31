import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from '@datastax/astra-db-ts';

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    const collection = await astraDb.collection('usersandloobricates');

    // Find user by pseudonym
    const user = await collection.findOne({
      pseudonym: username,
      dataType: 'userAccount'
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If found, update their connectedLoobricates array if it doesn't exist
    if (!user.connectedLoobricates) {
      await collection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            connectedLoobricates: [],
            updatedAt: new Date().toISOString()
          } 
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      userId: user._id,
      pseudonym: user.pseudonym 
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    );
  }
} 