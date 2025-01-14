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
 * Upsert a 'memory' document into the `library` collection.
 * Ensures no duplicates by using `url` as the unique identifier.
 */
const upsertMemoryEntry = async (entry: MemoryEntry): Promise<void> => {
  const collection = await astraDb.collection('library');

  try {
    // Generate embedding for the memory content
    console.log(`Generating embedding for memory URL: ${entry.url}`);
    const { data } = await openai.embeddings.create({
      input: entry.content,
      model: 'text-embedding-ada-002',
    });

    const embedding = data[0]?.embedding;
    if (!embedding) {
      console.error(`Failed to generate embedding for URL: ${entry.url}`);
      return;
    }

    const memoryDoc = {
      document_id: entry.url, // Use URL as the unique identifier
      $vector: embedding,
      url: entry.url,
      title: entry.title,
      content: entry.content,
      dataType: 'memory',
      createdAt: new Date().toISOString(),
    };

    // Perform upsert using findOneAndReplace
    await collection.findOneAndReplace(
      { document_id: entry.url }, // Query by unique identifier
      memoryDoc,
      { upsert: true } // Replace or insert if not found
    );
    console.log(`Upserted memory entry for URL: ${entry.url}`);
  } catch (error) {
    console.error(`Error upserting memory entry for URL: ${entry.url}`, error);
  }
};

/**
 * Upsert a 'userEntry' document into the `library` collection.
 * Ensures no duplicates by using `email` as the unique identifier.
 */
const upsertUserEntry = async (entry: UserEntry): Promise<void> => {
  const collection = await astraDb.collection('library');

  try {
    // Generate embedding for the user entry chunk
    console.log(`Generating embedding for userEntry: ${entry.title}`);
    const { data } = await openai.embeddings.create({
      input: entry.chunk,
      model: 'text-embedding-ada-002',
    });

    const embedding = data[0]?.embedding;
    if (!embedding) {
      console.error(`Failed to generate embedding for userEntry: ${entry.title}`);
      return;
    }

    const userDoc = {
      document_id: entry.email, // Use email as the unique identifier
      $vector: embedding,
      title: entry.title,
      offeringType: entry.offeringType,
      description: entry.description,
      location: entry.location,
      pseudonym: entry.pseudonym,
      email: entry.email,
      phone: entry.phone,
      dataType: 'userEntry',
      createdAt: new Date().toISOString(),
    };

    // Perform upsert using findOneAndReplace
    await collection.findOneAndReplace(
      { document_id: entry.email }, // Query by unique identifier
      userDoc,
      { upsert: true } // Replace or insert if not found
    );
    console.log(`Upserted userEntry: ${entry.title}`);
  } catch (error) {
    console.error(`Error upserting userEntry: ${entry.title}`, error);
  }
};

/**
 * Main function to handle creation of 'library' and upserting entries.
 */
const populateLibrary = async (): Promise<void> => {
  console.log('Starting population of the library...');
  await createLibraryCollection();

  for (const entry of entries) {
    if (entry.dataType === 'memory') {
      // Handle memory entries
      await upsertMemoryEntry(entry);
    } else if (entry.dataType === 'userEntry') {
      // Handle user entries
      await upsertUserEntry(entry);
    } else {
      console.log(`Skipping entry with unknown dataType: ${JSON.stringify(entry)}`);
    }
  }

  console.log('Library population complete.');
};

// Execute the script
populateLibrary().catch((error) => {
  console.error('Error during library population:', error);
});
