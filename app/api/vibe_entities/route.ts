import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";
import Pusher from 'pusher';

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

const pusher = new Pusher({
  appId: "1761208",
  key: "facc28e7df1eec1d7667",
  secret: "79b0023a6876ad35a230",
  cluster: "eu",
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    const { id, state } = await request.json();

    if (!id || !state) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Trigger Pusher event for the specific entity
    await pusher.trigger(`user-${id}`, "vibe-update", {
      ...state,
      entityId: id,
      timestamp: new Date().toISOString()
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in vibe_entities route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const collection = await astraDb.collection('usersandloobricates');
    const url = new URL(request.url);
    const loobricateId = url.searchParams.get('loobricateId');

    if (!loobricateId) {
      return NextResponse.json(
        { error: 'loobricateId is required' },
        { status: 400 }
      );
    }

    const loobricate = await collection.findOne({ _id: loobricateId });
    
    if (!loobricate?.visual_state) {
      // Generate initial visual state if it doesn't exist
      const initialState = {
        complexity: 1 + Math.random(),
        energy: 0.3 + Math.random() * 0.4,
        harmony: 0.3 + Math.random() * 0.4,
        mutations: [],
        quaternion: {
          x: Math.random() * 0.2 - 0.1,
          y: Math.random() * 0.2 - 0.1,
          z: Math.random() * 0.2 - 0.1,
          w: 1
        },
        material_state: {
          specularPower: 256 + Math.random() * 128,
          swirlSpeed: 1.5 + Math.random(),
          persistence: 0.5 + Math.random() * 0.3
        }
      };

      // Update the loobricate with initial visual state
      await collection.updateOne(
        { _id: loobricateId },
        { 
          $set: { 
            visual_state: initialState,
            last_visual_update: new Date().toISOString()
          }
        }
      );

      return NextResponse.json({ visual_state: initialState });
    }

    return NextResponse.json({ visual_state: loobricate.visual_state });
  } catch (error) {
    console.error('Error fetching visual state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visual state' },
      { status: 500 }
    );
  }
} 