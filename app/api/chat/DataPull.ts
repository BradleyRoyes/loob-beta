// Import necessary dependencies
import { NextApiRequest, NextApiResponse } from 'next';
import { AstraDB } from '@datastax/astra-db-ts';

// Initialize AstraDB with your configuration
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

// Define the API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Connect to the 'messages' collection in your database
    const messagesCollection = await astraDb.collection('messages');

    // Fetch all mood and keywords entries from the database
    const moodAndKeywords = await messagesCollection.find({}, { projection: { mood: 1, keywords: 1 } }).toArray();

    // Extract mood and keywords from each entry
    const moodData = moodAndKeywords.map(entry => entry.mood);
    const keywordsData = moodAndKeywords.reduce((acc, entry) => acc.concat(entry.keywords), []);

    // Send the mood and keywords data as the API response
    res.status(200).json({ mood: moodData, keywords: keywordsData });
  } catch (error) {
    console.error('Error fetching mood and keywords data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
