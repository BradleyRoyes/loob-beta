import { NextResponse } from 'next/server';
import { AstraDB, Collection } from '@datastax/astra-db-ts';

// Initialize AstraDB with your configuration
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

// Function to get the 'library' collection (or any collection name you prefer)
async function getLibraryCollection(): Promise<Collection> {
  try {
    const collection = await astraDb.collection('library');
    return collection;
  } catch (error) {
    console.error('Error accessing library collection:', error);
    throw new Error('Database connection failed.');
  }
}

/**
 * GET /api/mapData
 * Fetch all documents (or just user entries) from the "library" collection.
 */
export async function GET() {
  try {
    const libraryCollection = await getLibraryCollection();

    // Example: fetch only docs that have dataType = 'userEntry'
    // If you need *all* docs, just do: libraryCollection.find({})
    const documents = await libraryCollection.find({ dataType: 'userEntry' }).toArray();

    // Return the documents
    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/mapData:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
