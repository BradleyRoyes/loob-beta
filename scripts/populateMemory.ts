require('dotenv').config({ path: './.env.local' });
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from 'openai';
import sampleData from './sample_data.json'; // Adjust path if needed

// Initialize OpenAI and AstraDB
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const {
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_NAMESPACE
} = process.env;

const astraDb = new AstraDB(
  ASTRA_DB_APPLICATION_TOKEN!,
  ASTRA_DB_ENDPOINT!,
  ASTRA_DB_NAMESPACE!
);

// Define TypeScript interfaces for the entries
interface MemoryEntry {
  url: string;
  title: string;
  content: string;
  dataType: 'memory';
}

interface UserEntry {
  title: string;
  offeringType: 'venue' | 'gear' | 'talent';
  description: string;
  location: string;
  pseudonym: string;
  email: string;
  phone: string;
  chunk: string;
  dataType: 'userEntry';
}

type LibraryEntry = MemoryEntry | UserEntry;

const entries: LibraryEntry[] = sampleData as LibraryEntry[];

/**
 * Create or verify a 'library' collection with vector search capabilities.
 */
const createLibraryCollection = async (): Promise<void> => {
  try {
    const res = await astraDb.createCollection('library', {
      vector: {
        dimension: 1536, // For text-embedding-ada-002 model
        metric: 'cosine',
      },
    });
    console.log('Library collection created successfully:', res);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('Library collection already exists. Skipping creation.');
    } else {
      console.error('Error creating library collection:', error);
    }
  }
};

/**
 * Validate entries to ensure required fields are present.
 */
const isValidEntry = (entry: LibraryEntry): boolean => {
  if (entry.dataType === 'memory') {
    return !!entry.url && !!entry.content && !!entry.title;
  }
  if (entry.dataType === 'userEntry') {
    return !!entry.email && !!entry.chunk && !!entry.title;
  }
  return false;
};

/**
 * Upsert a document into the `library` collection.
 * Ensures no duplicates and validates `_id` generation.
 */
const upsertEntry = async (entry: LibraryEntry): Promise<void> => {
  const collection = await astraDb.collection('library');

  // Determine unique `_id` based on entry type
  const _id = entry.dataType === 'memory' ? entry.url : entry.email;

  if (!_id) {
    console.error(`Skipping entry due to missing unique identifier: ${JSON.stringify(entry)}`);
    return;
  }

  try {
    // Generate embedding only for valid entries
    console.log(`Generating embedding for entry: ${entry.title}`);
    const input = entry.dataType === 'memory' ? entry.content : entry.chunk;
    const { data } = await openai.embeddings.create({
      input,
      model: 'text-embedding-ada-002',
    });

    const embedding = data[0]?.embedding;
    if (!embedding) {
      console.error(`Failed to generate embedding for entry: ${entry.title}`);
      return;
    }

    const doc = {
      _id, // Use unique `_id` for deduplication
      $vector: embedding,
      ...entry,
      createdAt: new Date().toISOString(),
    };

    // Upsert the document
    await collection.findOneAndReplace(
      { _id }, // Query by unique `_id`
      doc,
      { upsert: true } // Replace or insert
    );
    console.log(`Upserted entry: ${entry.title}`);
  } catch (error) {
    console.error(`Error upserting entry: ${entry.title}`, error);
  }
};

/**
 * Main function to handle creation of 'library' and upserting entries.
 */
const populateLibrary = async (): Promise<void> => {
  console.log('Starting population of the library...');
  await createLibraryCollection();

  for (const entry of entries) {
    if (!isValidEntry(entry)) {
      console.log(`Skipping invalid entry: ${JSON.stringify(entry)}`);
      continue;
    }

    await upsertEntry(entry);
  }

  console.log('Library population complete.');
};

// Execute the script
populateLibrary().catch((error) => {
  console.error('Error during library population:', error);
});
