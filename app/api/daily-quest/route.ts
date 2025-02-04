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

// Hyperspace cheat codes
const HYPERSPACE_CODES = [
  {
    code: 1,
    description: "The game is infinite: The game has an infinite number of levels in an infinite number of dimensions"
  },
  {
    code: 2,
    description: "Anamesis: The purpose of the game is to remember you are playing it. The forgetting of the forgetting"
  },
  {
    code: 3,
    description: "The more levels of the game you remember you are playing, the more fun and consequential the game becomes"
  },
  {
    code: 4,
    description: "Higher levels of the game can bleed through into 3D. They often show up at coincidences, synchronicities, or absurdity"
  },
  {
    code: 5,
    description: "The 3D is the access point to all the other levels of the game. If you die at the 3D level of the game, it is game over unless proven otherwise"
  },
  {
    code: 6,
    description: "Don't say anything or think anything that you don't want to become more true"
  },
  {
    code: 7,
    description: "Find the others: Once you have figured out the game, help turn as many NPC's into Players and as many Players into Architects as you can"
  },
  {
    code: 8,
    description: "Stay awake, build stuff and help out"
  }
];

async function generateQuestContext(userId: string, astraDb: any, openai: any): Promise<{ context: string, cheatCode: typeof HYPERSPACE_CODES[number] }> {
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

    // Select a random cheat code
    const randomCheatCode = HYPERSPACE_CODES[Math.floor(Math.random() * HYPERSPACE_CODES.length)];

    return {
      context: `
User's Recent Thoughts:
${dumpContext}

Available Community Resources:
${libraryContext}

Today's Hyperspace Lens - Cheat Code #${randomCheatCode.code}:
${randomCheatCode.description}
      `,
      cheatCode: randomCheatCode
    };
  } catch (error) {
    console.error("Error generating quest context:", error);
    return {
      context: "Error retrieving context",
      cheatCode: HYPERSPACE_CODES[7] // Default to "Stay awake, build stuff and help out"
    };
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
      return NextResponse.json({ 
        quest: existingQuest.content,
        cheatCode: existingQuest.cheatCode
      });
    }

    // Generate context and get random cheat code
    const { context, cheatCode } = await generateQuestContext(userId, astraDb, openai);

    // Generate the quest using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a mystical guide in Berlin's creative underground scene. Your task is to generate a single, inspiring daily quest that encourages community engagement and creative exploration. The quest should be playful, slightly cryptic (like a tarot reading), but actionable.

Today's quest should be inspired by and subtly incorporate the wisdom of this hyperspace cheat code:
"${cheatCode.description}"

Format your response as a JSON object with two fields:
1. "quest" - A single sentence that starts with "Your quest today:" and incorporates real locations or resources from the provided context when relevant.
2. "explanation" - A brief mystical explanation of how this quest relates to the cheat code, written in a cryptic but inspiring way.

Consider:
- The user's interests and patterns from their daily dumps
- Available community resources and spaces
- The quest should be achievable in a day
- Mix practical community engagement with a touch of whimsy
- Use poetic/mystical language but keep it clear
- Sometimes reference specific Loobrary resources when relevant

Example response:
{
  "quest": "Your quest today: Seek out the echoing chambers of Traumabar, where electronic whispers await your contribution to their open jam session.",
  "explanation": "As the game bleeds through dimensions (Cheat Code #4), synchronicities emerge in shared rhythms and collective resonance."
}`
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content;
    let questData;
    try {
      questData = JSON.parse(response || "{}");
    } catch (error) {
      console.error("Failed to parse quest response:", error);
      questData = {
        quest: "Seek inspiration in unexpected places today.",
        explanation: "Sometimes the game reminds us to stay awake and help out."
      };
    }

    // Save the quest
    await messagesCollection.insertOne({
      userId,
      type: "daily_quest",
      content: questData.quest,
      explanation: questData.explanation,
      cheatCode: cheatCode,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      quest: questData.quest,
      explanation: questData.explanation,
      cheatCode: {
        number: cheatCode.code,
        description: cheatCode.description
      }
    });
  } catch (error) {
    console.error('Error generating daily quest:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily quest' },
      { status: 500 }
    );
  }
} 