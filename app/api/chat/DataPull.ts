import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@astrajs/collections'; // Assuming AstraDB is similar to AstraJS

// AstraDB client initialization should be outside the handler to avoid reinitializing per request
const astraClient = createClient({
  astraDatabaseId: process.env.ASTRA_DB_ID,
  astraDatabaseRegion: process.env.ASTRA_DB_REGION,
  applicationToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
});

// Define the API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure the client is connected and fetch the 'messages' collection
    const messagesCollection = astraClient
      .namespace(process.env.ASTRA_DB_NAMESPACE) // Assuming namespace is akin to a keyspace
      .collection('messages');

    // Fetch all mood and keywords entries from the database
    const { data: moodAndKeywords, status } = await messagesCollection.find({});

    if (status !== 200) {
      throw new Error('Failed to fetch data from AstraDB');
    }

    // Extract mood and keywords from each entry
    const moodData = Object.values(moodAndKeywords).map(entry => entry.mood);
    const keywordsData = Object.values(moodAndKeywords).reduce((acc, entry) => acc.concat(entry.keywords), []);

    // Send the mood and keywords data as the API response
    res.status(200).json({ mood: moodData, keywords: keywordsData });
  } catch (error) {
    console.error('Error fetching mood and keywords data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
