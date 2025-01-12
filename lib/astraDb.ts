// lib/astraDB.ts
import { AstraDB } from '@datastax/astra-db-ts';

const {
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_NAMESPACE,
} = process.env;

// Initialize AstraDB connection
const astraDb = new AstraDB(
  ASTRA_DB_APPLICATION_TOKEN,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_NAMESPACE
);

/**
 * Initializes a collection with vector capabilities.
 * @param {string} collectionName - Name of the collection.
 * @param {string} similarityMetric - Similarity metric (e.g., 'cosine').
 */
export const initializeCollection = async (
  collectionName: string,
  similarityMetric: 'cosine' | 'euclidean' | 'dot_product' = 'cosine'
) => {
  try {
    const res = await astraDb.createCollection(collectionName, {
      vector: {
        dimension: 1536, // Ensure this matches your embedding model's dimension
        metric: similarityMetric,
      },
    });
    console.log(`Collection "${collectionName}" created:`, res);
  } catch (e) {
    console.log(`Collection "${collectionName}" already exists.`);
  }
};

/**
 * Retrieves a collection.
 * @param {string} collectionName - Name of the collection.
 * @returns {Collection} - AstraDB Collection Instance
 */
export const getCollection = async (collectionName: string) => {
  return await astraDb.collection(collectionName);
};
