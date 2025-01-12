require('dotenv').config({ path: './.env.local' });
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from 'openai';
import sampleData from './sample_data.json'; // Adjust the path if needed

// Initialize OpenAI and AstraDB
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_ENDPOINT, ASTRA_DB_NAMESPACE } = process.env;

const astraDb = new AstraDB(
  ASTRA_DB_APPLICATION_TOKEN!,
  ASTRA_DB_ENDPOINT!,
  ASTRA_DB_NAMESPACE!
);

/**
 * Create the `library` collection with vector search capabilities.
 */
const createLibraryCollection = async (): Promise<void> => {
  try {
    const res = await astraDb.createCollection('library', {
      vector: {
        dimension: 1536, // Dimension for text-embedding-ada-002 model
        metric: 'cosine', // Use cosine similarity
      },
    });
    console.log('Library collection created successfully:', res);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Library collection already exists. Skipping creation.');
    } else {
      console.error('Error creating library collection:', error);
    }
  }
};

/**
 * Insert a document into the `library` collection with embeddings.
 * Skips insertion if a duplicate entry exists.
 */
const insertEntryWithEmbedding = async (entry: {
  url: string;
  title: string;
  content: string;
}): Promise<void> => {
  const collection = await astraDb.collection('library');

  // Check for duplicates based on `url`
  const existingEntry = await collection.findOne({ url: entry.url });
  if (existingEntry) {
    console.log(`Duplicate entry found for URL: ${entry.url}. Skipping.`);
    return;
  }

  try {
    // Generate embedding
    console.log(`Generating embedding for URL: ${entry.url}`);
    const { data } = await openai.embeddings.create({
      input: entry.content,
      model: 'text-embedding-ada-002',
    });

    const embedding = data[0]?.embedding;
    if (!embedding) {
      console.error(`Failed to generate embedding for URL: ${entry.url}`);
      return;
    }

    // Create document
    const document = {
      document_id: `${entry.url}-${Date.now()}`, // Unique ID combining URL and timestamp
      $vector: embedding, // Embedding vector
      url: entry.url,
      title: entry.title,
      content: entry.content,
      dataType: 'memory', // Mark as memory data
      createdAt: new Date().toISOString(), // Add timestamp
    };

    // Insert document
    await collection.insertOne(document);
    console.log(`Inserted entry: ${entry.title}`);
  } catch (error) {
    console.error(`Error processing entry for URL: ${entry.url}`, error);
  }
};

/**
 * Process all entries in the sample data file.
 */
const populateMemory = async (): Promise<void> => {
  console.log('Starting memory population...');

  // Step 1: Ensure library collection exists
  await createLibraryCollection();

  // Step 2: Process each entry
  for (const entry of sampleData) {
    await insertEntryWithEmbedding(entry);
  }

  console.log('Memory population complete.');
};

// Execute the script
populateMemory().catch((error) => {
  console.error('Error during memory population:', error);
});
