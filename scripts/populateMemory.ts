require('dotenv').config({ path: './.env.local' });
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from 'openai';
import sampleData from './sample_data.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const {
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_NAMESPACE,
} = process.env;

const astraDb = new AstraDB(
  ASTRA_DB_APPLICATION_TOKEN!,
  ASTRA_DB_ENDPOINT!,
  ASTRA_DB_NAMESPACE!
);

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
  loobricates: string[];
  dataType: 'userEntry';
}

type LibraryEntry = MemoryEntry | UserEntry;

const entries: LibraryEntry[] = sampleData as LibraryEntry[];

const createLibraryCollection = async (): Promise<void> => {
  try {
    const res = await astraDb.createCollection('library', {
      vector: { dimension: 1536, metric: 'cosine' },
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

const insertEntry = async (entry: LibraryEntry): Promise<void> => {
  const collection = await astraDb.collection('library');

  const existingEntry = await collection.findOne({ title: entry.title });
  if (existingEntry) {
    console.log(`Duplicate entry found for title: "${entry.title}". Skipping.`);
    return;
  }

  try {
    let embedding: number[] | null = null; // Allow both null and number[] types

    if (entry.dataType === 'memory' || entry.dataType === 'userEntry') {
      console.log(`Generating embedding for title: "${entry.title}"`);
      const response = await openai.embeddings.create({
        input: entry.dataType === 'memory' ? entry.content : entry.chunk,
        model: 'text-embedding-ada-002',
      });
    
      embedding = response.data[0]?.embedding || null; // Assign embedding or keep it as null
      if (!embedding) {
        console.error(`Failed to generate embedding for title: "${entry.title}"`);
        return;
      }
    }
    

    const document = {
      document_id: `${entry.title}-${Date.now()}`,
      $vector: embedding,
      ...entry,
      createdAt: new Date().toISOString(),
    };

    await collection.insertOne(document);
    console.log(`Inserted entry for title: "${entry.title}"`);
  } catch (error) {
    console.error(`Error inserting entry for title: "${entry.title}"`, error);
  }
};

const populateLibrary = async (): Promise<void> => {
  console.log('Starting library population...');
  await createLibraryCollection();

  for (const entry of entries) {
    await insertEntry(entry);
  }

  console.log('Library population complete.');
};

// Run the script only if not already populated
const initializeLibrary = async (): Promise<void> => {
  const collection = await astraDb.collection('library');
  const count = await collection.countDocuments();
  if (count > 0) {
    console.log('Library already populated. Skipping initialization.');
    return;
  }

  await populateLibrary();
};

initializeLibrary().catch((error) => {
  console.error('Error initializing library:', error);
});
