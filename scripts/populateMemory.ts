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

// Define a TypeScript interface for the entries
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

// Union type for either memory or userEntry
type LibraryEntry = MemoryEntry | UserEntry;

// Ensure `sampleData` is typed correctly
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
 * Insert a 'memory' document into the `library` collection with fresh embeddings.
 * Skips insertion if a duplicate entry exists (based on `url`).
 */
const insertMemoryEntry = async (entry: MemoryEntry): Promise<void> => {
  const collection = await astraDb.collection('library');

  // Check for duplicates by url
  const existingEntry = await collection.findOne({ url: entry.url });
  if (existingEntry) {
    console.log(`Duplicate memory found for URL: ${entry.url}. Skipping.`);
    return;
  }

  try {
    // Generate embedding from content
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

    // Create final doc to insert
    const memoryDoc = {
      document_id: `${entry.url}-${Date.now()}`, // unique ID from url + timestamp
      $vector: embedding,
      url: entry.url,
      title: entry.title,
      content: entry.content,
      dataType: 'memory', // explicitly label as memory
      createdAt: new Date().toISOString(),
    };

    await collection.insertOne(memoryDoc);
    console.log(`Inserted memory entry for URL: ${entry.url}`);
  } catch (error) {
    console.error(`Error processing memory for URL: ${entry.url}`, error);
  }
};

/**
 * Insert a 'userEntry' document into the `library` collection.
 * Regenerates the vector using OpenAI, dynamically generates `_id`, and ensures no conflicts with existing schema.
 */
const insertUserEntry = async (entry: UserEntry): Promise<void> => {
  const collection = await astraDb.collection('library');

  try {
    // Generate embedding for the `chunk` field
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

    // Create final doc to insert
    const userDoc = {
      document_id: `${entry.email}-${Date.now()}`, // Generate unique ID
      $vector: embedding, // Use generated embedding
      title: entry.title,
      offeringType: entry.offeringType,
      description: entry.description,
      location: entry.location,
      pseudonym: entry.pseudonym,
      email: entry.email,
      phone: entry.phone,
      dataType: 'userEntry',
      createdAt: new Date().toISOString(), // Use the current timestamp
    };

    // Insert into the DB
    await collection.insertOne(userDoc);
    console.log(`Inserted userEntry: ${entry.title}`);
  } catch (error) {
    console.error(`Error inserting userEntry: ${entry.title}`, error);
  }
};

/**
 * Main function to handle creation of 'library' + insertion of both memory & user entries.
 */
const populateMemory = async (): Promise<void> => {
  console.log('Starting population of the library...');
  await createLibraryCollection();

  for (const entry of entries) {
    if (entry.dataType === 'memory') {
      // Handle memory entries
      await insertMemoryEntry(entry);
    } else if (entry.dataType === 'userEntry') {
      // Handle user entries
      await insertUserEntry(entry);
    } else {
      console.log(`Skipping entry with unknown dataType: ${JSON.stringify(entry)}`);
    }
  }

  console.log('Library population complete.');
};

// Execute the script
populateMemory().catch((error) => {
  console.error('Error during library population:', error);
});
