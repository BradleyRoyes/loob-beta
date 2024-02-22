import { NextApiRequest, NextApiResponse } from "next";
import { AstraDB } from "@datastax/astra-db-ts";

// It's crucial to ensure that your AstraDB instance is initialized outside of the request handler
// to avoid the cost of reinitialiating it on every request.
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE,
);

console.log("something");

// export async function POST(req: any, res: any) {
//   res.status(200).json({ message: "API is reachable post" });
//   console.log("reachable post");
// }

// Define the API route handler to fetch moods and keywords
export async function GET(req: any, res: any) {
  res.status(200).json({ message: "API is reachable" });
  console.log("reachable");
  try {
    // Make sure to call the function to get or initialize the AstraDB instance.

    // Connect to the 'messages' collection in your database
    const messagesCollection = await astraDb.collection("messages");

    // Perform the find operation to get the cursor
    const cursor = await messagesCollection.find({}, {
      projection: { mood: 1, keywords: 1 },
    });

    // Convert the cursor to an array
    const moodAndKeywords = await cursor.toArray(); // This line is crucial

    // Now you can use .map() and .reduce() on moodAndKeywords
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
