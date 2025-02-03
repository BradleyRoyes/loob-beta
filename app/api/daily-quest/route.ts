import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from "openai";
import { format } from 'date-fns';

// Initialize OpenAI and AstraDB
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

async function generateQuestContext(userId: string, astraDb: any, openai: any): Promise<string> {
  try {
    // Get user's daily dumps
    const messagesCollection = await astraDb.collection("messages");
    const userDumps = await messagesCollection.find({
      userId,
      type: "daily_dump"
    }).toArray();

    // Get relevant Loobrary entries
    const libraryCollection = await astraDb.collection("library");
    const libraryEntries = await libraryCollection.find({}, { limit: 5 }).toArray();

    // Format the context
    const dumpContext = userDumps.map(dump => 
      `Date: ${format(new Date(dump.createdAt), 'MMM d, yyyy')}\nContent: ${dump.content}`
    ).join('\n\n');

    const libraryContext = libraryEntries.map(entry => 
      `Resource: ${entry.title}\nType: ${entry.type}\nDescription: ${entry.description || 'No description'}`
    ).join('\n\n');

    return `
User's Recent Thoughts:
${dumpContext}

Available Community Resources:
${libraryContext}
    `;
  } catch (error) {
    console.error("Error generating quest context:", error);
    return "Error retrieving context";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get today's date at midnight for caching
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already generated a quest for this user today
    const messagesCollection = await astraDb.collection("messages");
    const existingQuest = await messagesCollection.findOne({
      userId,
      type: "daily_quest",
      createdAt: { $gte: today }
    });

    if (existingQuest) {
      return NextResponse.json({ quest: existingQuest.content });
    }

    // Generate context for the quest
    const context = await generateQuestContext(userId, astraDb, openai);

    // Generate the quest using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a mystical guide in Berlin's creative underground scene. Your task is to generate a single, inspiring daily quest that encourages community engagement and creative exploration. The quest should be playful, slightly cryptic (like a tarot reading), but actionable.

Format your response as a single sentence that starts with "Your quest today:" and incorporates real locations or resources from the provided context when relevant.

Consider:
- The user's interests and patterns from their daily dumps
- Available community resources and spaces
- The quest should be achievable in a day
- Mix practical community engagement with a touch of whimsy
- Use poetic/mystical language but keep it clear
- Sometimes reference specific Loobrary resources when relevant

Example quests:
"Your quest today: Seek out the echoing chambers of Traumabar, where electronic whispers await your contribution to their open jam session."
"Your quest today: Among the shelves of Bücherhalle, find three strangers' stories and weave them into your own creative tapestry."
"Your quest today: When the clock strikes four, venture to the community garden and exchange one skill for another with a fellow seeker of knowledge."
`
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.9,
      max_tokens: 100,
    });

    const quest = completion.choices[0]?.message?.content || "Seek inspiration in unexpected places today.";

    // Save the quest
    await messagesCollection.insertOne({
      userId,
      type: "daily_quest",
      content: quest,
      createdAt: new Date(),
    });

    return NextResponse.json({ quest });
  } catch (error) {
    console.error('Error generating daily quest:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily quest' },
      { status: 500 }
    );
  }
} 