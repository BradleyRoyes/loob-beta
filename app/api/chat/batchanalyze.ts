import { NextResponse } from "next/server";
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize Astra DB client
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN as string,
  process.env.ASTRA_DB_ENDPOINT as string,
  process.env.ASTRA_DB_NAMESPACE as string
);

// Helper function to calculate average mood scores
const moodScores = {
  happy: 3,
  neutral: 2,
  sad: 1,
};
const calculateAverageMood = (moods: string[]) => {
  const totalScore = moods.reduce(
    (acc, mood) => acc + (moodScores[mood] || 0),
    0
  );
  return totalScore / moods.length;
};

// Group data by day
const groupByDay = (messages: any[]) => {
  const grouped: Record<string, { moods: string[]; keywords: string[] }> = {};

  for (const message of messages) {
    const day = new Date(message.createdAt["$date"]).toISOString().split("T")[0];

    if (!grouped[day]) {
      grouped[day] = { moods: [], keywords: [] };
    }

    if (message.mood) {
      grouped[day].moods.push(message.mood);
    }

    if (Array.isArray(message.keywords)) {
      grouped[day].keywords.push(...message.keywords);
    }
  }

  return grouped;
};

export async function GET() {
  try {
    const messagesCollection = await astraDb.collection("messages");
    const messages = await messagesCollection.find({}).toArray();

    // Group messages by day
    const groupedData = groupByDay(messages);

    // Prepare data for dashboard
    const dailyData = Object.entries(groupedData).map(([day, data]) => ({
      day,
      averageMood: calculateAverageMood(data.moods),
      keywords: data.keywords,
    }));

    return NextResponse.json({ dailyData });
  } catch (error) {
    console.error("Error fetching data from Astra DB:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from the database." },
      { status: 500 }
    );
  }
}
