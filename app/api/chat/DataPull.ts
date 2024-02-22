import { NextApiRequest, NextApiResponse } from "next";
import { AstraDB } from "@datastax/astra-db-ts";

// It's crucial to ensure that your AstraDB instance is initialized outside of the request handler
// to avoid the cost of reinitialiating it on every request.
let astraDb;

// This function ensures that the AstraDB instance is created only once.
function getAstraDbInstance() {
  if (!astraDb) {
    astraDb = new AstraDB(
      process.env.ASTRA_DB_APPLICATION_TOKEN,
      process.env.ASTRA_DB_ENDPOINT,
      process.env.ASTRA_DB_NAMESPACE,
    );
  }
  return astraDb;
}

// Define the API route handler to fetch moods and keywords
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.status(200).json({ message: "API is reachable" });
  console.log("reachable");
  try {
    // Make sure to call the function to get or initialize the AstraDB instance.
    const db = getAstraDbInstance();
    // Connect to the 'messages' collection in your database
    const messagesCollection = await db.collection("messages");

    // Adjusted the find query to potentially handle any issues with empty projections or cursor handling.
    const moodAndKeywords = await messagesCollection.find(
      {},
      {
        projection: { mood: 1, keywords: 1 },
      },
    );

    // The revised logic here assumes the updated find method returns the documents array directly.
    const moodData = moodAndKeywords.map((entry) => entry.mood);
    const keywordsData = moodAndKeywords.reduce((acc, entry) => {
      if (entry.keywords) {
        return acc.concat(entry.keywords);
      }
      return acc;
    }, []);

    console.log(moodAndKeywords); // This will log the fetched data for debugging purposes.
    console.log("here1");

    // Send the mood and keywords data as the API response
    res.status(200).json({ mood: moodData, keywords: keywordsData });
  } catch (error) {
    console.error("Error fetching mood and keywords data:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
    console.log("here2");
  }
  console.log("here3");
}
