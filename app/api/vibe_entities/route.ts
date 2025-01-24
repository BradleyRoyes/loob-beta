import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../lib/astraDb';

// Keep track of message counts per loobricate
const messageCounters: { [key: string]: number } = {};
const BATCH_SIZE = 5; // Process every 5 messages

interface MessageBatch {
  messages: string[];
  timestamps: string[];
}

const batchBuffer: { [key: string]: MessageBatch } = {};

export async function POST(req: NextRequest) {
  try {
    const collection = await getCollection('vibe_entities');
    const data = await req.json();
    const { loobricate_id, message, timestamp } = data;

    // Initialize counter and batch if needed
    if (!messageCounters[loobricate_id]) {
      messageCounters[loobricate_id] = 0;
    }
    if (!batchBuffer[loobricate_id]) {
      batchBuffer[loobricate_id] = { messages: [], timestamps: [] };
    }

    // Add message to batch
    batchBuffer[loobricate_id].messages.push(message);
    batchBuffer[loobricate_id].timestamps.push(timestamp);
    messageCounters[loobricate_id]++;

    // Only process when we have enough messages
    if (messageCounters[loobricate_id] >= BATCH_SIZE) {
      const batch = batchBuffer[loobricate_id];
      
      // Analyze all messages in batch
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000'
          : '';
          
      const response = await fetch(`${baseUrl}/api/chat/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: batch.messages.map(msg => ({ role: 'user', content: msg }))
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze messages');
      const batchAnalysis = await response.json();

      // Get current state
      const currentEntity = await collection.findOne({ loobricate_id });
      const currentState = currentEntity?.visual_state || {
        complexity: 1,
        energy: 0.5,
        harmony: 0.5,
        mutations: [],
        quaternion: { x: 0, y: 0, z: 0, w: 1 },
        material_state: {
          specularPower: 256,
          swirlSpeed: 2.0,
          persistence: 0.7,
        }
      };

      // Calculate aggregate impact
      const moodCounts = batch.messages.reduce((acc, _, idx) => {
        const mood = batchAnalysis[idx]?.mood || 'neutral';
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const keywordSet = new Set(
        batch.messages.flatMap((_, idx) => batchAnalysis[idx]?.keywords || [])
      );

      // Create evolved state with fractal-influenced changes
      const vibeEntity = {
        loobricate_id,
        timestamp: batch.timestamps[batch.timestamps.length - 1],
        visual_state: {
          // Complexity grows based on unique keywords and conversation depth
          complexity: Math.min(5, currentState.complexity + (keywordSet.size * 0.05)),
          
          // Energy influenced by mood distribution
          energy: Math.min(1, Math.max(0.1, 
            currentState.energy + 
            ((moodCounts.positive || 0) * 0.1 - 
             (moodCounts.negative || 0) * 0.05) / BATCH_SIZE
          )),
          
          // Harmony builds up more slowly but persists
          harmony: Math.min(1, currentState.harmony + 
            batch.messages.reduce((acc, _, idx) => 
              acc + (batchAnalysis[idx]?.joinCyberdelicSociety === 'yes' ? 0.1 : 0.01), 0
            )
          ),
          
          // Accumulate significant mutations
          mutations: [
            ...currentState.mutations,
            ...batch.messages
              .filter((_, idx) => 
                batchAnalysis[idx]?.drink || 
                batchAnalysis[idx]?.joinCyberdelicSociety === 'yes'
              )
              .map((_, idx) => ({
                type: batchAnalysis[idx]?.drink ? 'drink' : 'join',
                timestamp: batch.timestamps[idx]
              }))
          ],
          
          // Evolve quaternion based on conversation flow
          quaternion: {
            x: currentState.quaternion.x + (Math.random() * 0.1 - 0.05),
            y: currentState.quaternion.y + (Math.random() * 0.1 - 0.05),
            z: currentState.quaternion.z + (Math.random() * 0.1 - 0.05),
            w: Math.max(0, Math.min(1, currentState.quaternion.w + (Math.random() * 0.1 - 0.05)))
          },
          
          // Update material properties based on conversation characteristics
          material_state: {
            specularPower: Math.min(512, 
              currentState.material_state.specularPower + 
              (keywordSet.size * 16)
            ),
            swirlSpeed: Math.max(0.5, Math.min(3.0,
              currentState.material_state.swirlSpeed +
              ((moodCounts.positive || 0) * 0.1 - 
               (moodCounts.negative || 0) * 0.05) / BATCH_SIZE
            )),
            persistence: Math.min(1, 
              currentState.material_state.persistence +
              (batch.messages.some(
                (_, idx) => batchAnalysis[idx]?.joinCyberdelicSociety === 'yes'
              ) ? 0.1 : 0.02)
            )
          }
        }
      };

      // Update database
      await collection.updateOne(
        { loobricate_id },
        { $set: vibeEntity },
        { upsert: true }
      );

      // Reset counters and batch
      messageCounters[loobricate_id] = 0;
      batchBuffer[loobricate_id] = { messages: [], timestamps: [] };

      return NextResponse.json({ success: true, processed: true });
    }

    return NextResponse.json({ success: true, processed: false });
  } catch (error) {
    console.error('Error updating vibe entity:', error);
    return NextResponse.json(
      { error: 'Failed to update vibe entity' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const collection = await getCollection('vibe_entities');
    const url = new URL(req.url);
    const loobricate_id = url.searchParams.get('loobricate_id');

    if (!loobricate_id) {
      return NextResponse.json(
        { error: 'loobricate_id is required' },
        { status: 400 }
      );
    }

    let vibeEntity = await collection.findOne({ loobricate_id });
    
    // Generate test data if entity doesn't exist
    if (!vibeEntity) {
      const testMutations = Array.from({ length: 10 }, (_, i) => ({
        type: Math.random() > 0.5 ? 'drink' : 'join',
        timestamp: new Date(Date.now() - (i * 1000 * 60)).toISOString()
      }));

      vibeEntity = {
        loobricate_id,
        timestamp: new Date().toISOString(),
        visual_state: {
          complexity: 1 + Math.random(),
          energy: 0.3 + Math.random() * 0.4,
          harmony: 0.3 + Math.random() * 0.4,
          mutations: testMutations,
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
        }
      };

      // Save the test entity
      await collection.insertOne(vibeEntity);
    }

    return NextResponse.json(vibeEntity);
  } catch (error) {
    console.error('Error fetching vibe entity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vibe entity' },
      { status: 500 }
    );
  }
} 