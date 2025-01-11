import { NextResponse } from 'next/server';
import { AstraDB, Collection } from '@datastax/astra-db-ts';
import { v4 as uuidv4 } from 'uuid';

// Initialize AstraDB with your configuration
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

// Function to get the 'messages' collection
const getMessagesCollection = async (): Promise<Collection> => {
  try {
    const collection = await astraDb.collection('messages');
    return collection;
  } catch (error) {
    console.error('Error accessing messages collection:', error);
    throw new Error('Database connection failed.');
  }
};

// Handle POST requests for sign-up
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { pseudonym, email, phone, interests, offerings, sessionId } = data;

    // Basic Validation
    if (!pseudonym || !email || !phone || !interests || !offerings || !sessionId) {
      return NextResponse.json(
        { message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Get the 'messages' collection
    const messagesCollection = await getMessagesCollection();

    // Pseudonym Availability Check
    const existingUsers = await messagesCollection.find({ pseudonym }).toArray(); // Use toArray to retrieve results
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Pseudonym is already taken. Please choose another one.' },
        { status: 409 }
      );
    }

    // Prepare sign-up data
    const signupData = {
      id: uuidv4(), // Unique identifier
      userId: pseudonym, // Pseudonym as the userId
      sessionId, // Session ID
      email,
      phone,
      interests, // Array of selected interests
      offerings, // Short answer field
      createdAt: new Date().toISOString(), // Timestamp
    };

    // Insert sign-up data into 'messages' collection
    await messagesCollection.insertOne(signupData);

    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/loobrary-signup:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handle GET requests to fetch all sign-ups (for testing)
export async function GET(request: Request) {
  try {
    // Get the 'messages' collection
    const messagesCollection = await getMessagesCollection();

    // Fetch all sign-up entries
    const allSignups = await messagesCollection.find({}).toArray(); // Use toArray to retrieve all results

    return NextResponse.json(allSignups, { status: 200 });
  } catch (error) {
    console.error('Error fetching Loobrary signups:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
