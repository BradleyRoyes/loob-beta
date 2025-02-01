import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from '@datastax/astra-db-ts';

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Await params at the start to prevent Next.js warnings
  const userId = await Promise.resolve(params.userId);

  try {
    console.log('Fetching user data for:', userId);
    
    const libraryCollection = await astraDb.collection('usersandloobricates');
    
    // Find the user document
    const userDoc = await libraryCollection.findOne({ 
      _id: userId,
      dataType: 'userAccount'
    });

    if (!userDoc) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log the found user data
    console.log('Found user data:', userDoc);

    // Return all user data except sensitive information
    const { password, ...userData } = userDoc;
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 