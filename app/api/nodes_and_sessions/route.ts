import { NextResponse } from "next/server";
import { AstraDB } from "@datastax/astra-db-ts";
import Pusher from "pusher";
import { v4 as uuidv4 } from "uuid";

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Combined collection for nodes and sessions
const collectionName = "nodes_and_sessions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // Query parameter: 'node' or 'session'

    const collection = await astraDb.collection(collectionName);
    const filter = type ? { type } : {}; // Filter by type if provided
    const data = await collection.find(filter);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, nodeId, updates, sessionId, nodes } = await req.json();
    const collection = await astraDb.collection(collectionName);

    if (action === "addOrUpdateNode") {
      // Add or update a single node (type: "node")
      await collection.updateOne(
        { id: nodeId },
        {
          $set: {
            ...updates,
            type: "node",
          },
        },
        { upsert: true }
      );

      // Notify Pusher about the node update
      await pusher.trigger("vibe-channel", "node-update", { nodeId, updates });

      return NextResponse.json({ success: true });
    } else if (action === "saveSession") {
      // Save session data (type: "session")
      await collection.insertOne({
        type: "session",
        sessionId: sessionId || uuidv4(),
        nodes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing POST request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { sessionId, updates } = await req.json();
    const collection = await astraDb.collection(collectionName);

    if (!sessionId || !updates) {
      return NextResponse.json(
        { error: "Invalid session ID or updates" },
        { status: 400 }
      );
    }

    await collection.updateOne(
      { sessionId, type: "session" },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing PUT request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

