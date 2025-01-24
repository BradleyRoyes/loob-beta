// mapData/route.ts

import { NextResponse } from 'next/server';
import { AstraDB, Collection } from '@datastax/astra-db-ts';

// Initialize AstraDB with your configuration
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

/**
 * Function to get the 'library' collection (or any collection name you prefer)
 */
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
 * Interface for query parameters
 */
interface MapDataQuery {
  dataType?: string;
  loobricates?: string;
}

/**
 * GET /api/mapData
 * 
 * Fetch all documents or filter by a specific Loobricate from the "library" collection.
 * Supports query parameters:
 *  - loobricate: string (optional) - to filter entries by a specific Loobricate
 */
export async function GET(request: Request) {
  try {
    const libraryCollection = await getLibraryCollection();

    // Parse query parameters
    const url = new URL(request.url);
    const loobricateParam = url.searchParams.get('loobricate');

    // Build the query object
    let query: MapDataQuery = { dataType: 'userEntry' };

    if (loobricateParam) {
      // Use the appropriate operator to query array fields.
      // Depending on AstraDB's query syntax, this might vary.
      // Assuming it uses MongoDB-like operators:
      query.loobricates = loobricateParam;
    }

    // Fetch documents based on the query
    const documents = await libraryCollection.find(query).toArray();

    // Normalize data: ensure 'loobricates' is always an array
    const normalizedDocuments = documents.map(doc => ({
      ...doc,
      loobricates: Array.isArray(doc.loobricates) ? doc.loobricates : [],
    }));

    // Return the documents
    return NextResponse.json(normalizedDocuments, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/mapData:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}