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
    const url = new URL(request.url);
    const loobricateParam = url.searchParams.get('loobricate');

    let query: MapDataQuery = {};
    if (loobricateParam) {
      query.loobricates = loobricateParam;
    }

    const documents = await libraryCollection.find(query).toArray();

    // Normalize data and ensure proper type assignment
    const normalizedDocuments = documents.map(doc => {
      // Ensure the type field is properly capitalized and matches our constants
      let normalizedType = doc.type || doc.offeringType || "Unknown";
      if (typeof normalizedType === 'string') {
        normalizedType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase();
      }

      // Generate random Berlin coordinates if none exist
      const coordinates = doc.lat && doc.lon ? { lat: doc.lat, lon: doc.lon } : getRandomBerlinLocation();

      return {
        ...doc,
        ...coordinates,
        type: normalizedType,
        loobricates: Array.isArray(doc.loobricates) ? doc.loobricates : [],
        isLoobricate: normalizedType === "Loobricate"
      };
    });

    console.log("Normalized documents:", normalizedDocuments);
    return NextResponse.json(normalizedDocuments, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/mapData:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

function getRandomBerlinLocation() {
  return {
    lat: 52.52 + (Math.random() - 0.5) * 0.1,
    lon: 13.405 + (Math.random() - 0.5) * 0.1
  };
}

function generateClusterPoints(center: { lat: number; lon: number }, count: number): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i < count; i++) {
    points.push({
      lat: center.lat + (Math.random() - 0.5) * 0.01,
      lon: center.lon + (Math.random() - 0.5) * 0.01
    });
  }
  return points;
}