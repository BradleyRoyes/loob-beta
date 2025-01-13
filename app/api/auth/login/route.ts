import { NextResponse } from 'next/server';
import { AstraDB, Collection } from '@datastax/astra-db-ts';

// 1) Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

// 2) Helper to get "messages" collection
async function getMessagesCollection(): Promise<Collection> {
  try {
    return await astraDb.collection('messages');
  } catch (error) {
    console.error('Error accessing messages collection:', error);
    throw new Error('Database connection failed.');
  }
}

// ---------------------------
// POST: Check user login
// ---------------------------
export async function POST(request: Request) {
  try {
    const { pseudonym, password } = await request.json();

    // Basic checks
    if (!pseudonym || !password) {
      return NextResponse.json(
        { error: 'Missing pseudonym or password.' },
        { status: 400 }
      );
    }

    // Access "messages" collection
    const messagesCollection = await getMessagesCollection();

    // Look up the user doc by pseudonym
    const userDoc = await messagesCollection.findOne({ pseudonym });

    if (!userDoc) {
      // No user with that pseudonym
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 401 }
      );
    }

    // Compare password (still plain text)
    if (userDoc.password !== password) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    // If matched, return success + user info
    return NextResponse.json(
      {
        message: 'Login successful.',
        user: {
          pseudonym: userDoc.pseudonym,
          email: userDoc.email,
          phone: userDoc.phone,
          // ...include any additional fields if you want
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/loobrary-login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
