import { NextRequest } from 'next/server';
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
  try {
    const userId = params.userId;
    console.log('Fetching user data for:', userId);
    
    const libraryCollection = await astraDb.collection('usersandloobricates');
    
    // Split the query into two separate operations since $or with _id is not supported
    let userDoc = await libraryCollection.findOne({ _id: userId });
    
    if (!userDoc) {
      // If not found by _id, try finding by pseudonym
      userDoc = await libraryCollection.findOne({ pseudonym: userId });
    }

    if (!userDoc) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(userDoc), {
      status: 200,
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
} 