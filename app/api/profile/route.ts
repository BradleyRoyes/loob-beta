import { NextRequest, NextResponse } from "next/server";
import { AstraDB, Collection } from "@datastax/astra-db-ts";

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

// Helper to get "library" collection
async function getLibraryCollection(): Promise<Collection> {
  try {
    return await astraDb.collection("library");
  } catch (error) {
    console.error("Error accessing library collection:", error);
    throw new Error("Database connection failed.");
  }
}

// Transform docs into the shape your Profile expects
function transformDocToVenue(doc: any) {
  return {
    id: doc._id ?? doc.document_id ?? "",
    label: doc.title ?? "Untitled",
    details: doc.description ?? doc.content ?? "No details available.",
    // Decide visualType from dataType/offeringType
    visualType:
      doc.offeringType === "talent"
        ? "ThisWeek"
        : doc.dataType === "memory"
        ? "AllTime"
        : "Today",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid"); // e.g. /api/profile?uid=Brad

    // If no pseudonym or "uid" given
    if (!uid) {
      return NextResponse.json(
        {
          user: null,
          entries: [],
          message: "No pseudonym provided.",
        },
        { status: 200 }
      );
    }

    // If user is anonymous
    if (uid.startsWith("anon")) {
      return NextResponse.json(
        {
          user: null,
          entries: [],
          message: "Anonymous user. Log in to see personal entries.",
        },
        { status: 200 }
      );
    }

    // Get the library collection
    const library = await getLibraryCollection();

    // Find all docs that match this pseudonym
    const cursor = await library.find({ pseudonym: uid });
    const docs = await cursor.toArray();

    // If none found, respond accordingly
    if (!docs || docs.length === 0) {
      return NextResponse.json(
        {
          user: null,
          entries: [],
          message: `No entries found for pseudonym: ${uid}`,
        },
        { status: 200 }
      );
    }

    // We assume one doc might be the "user doc" with password or dataType = userEntry
    let userDoc = docs.find(
      (doc) => doc.password && doc.dataType === "userEntry"
    );

    if (!userDoc) {
      // fallback: pick the first doc
      userDoc = docs[0];
    }

    // Build the user object
    const userObj = {
      pseudonym: userDoc.pseudonym ?? uid,
      email: userDoc.email ?? "",
      phone: userDoc.phone ?? "",
      description: userDoc.description ?? "",
    };

    // Filter docs that are considered "entries" (like dataType === 'userEntry', 'memory', or any logic)
    const entryDocs = docs.filter(
      (doc) =>
        doc.dataType === "userEntry" ||
        doc.dataType === "memory" ||
        doc.offeringType // or any logic you prefer
    );

    // Map them to the shape your Profile expects
    const entries = entryDocs.map(transformDocToVenue);

    // Return combined user + entries
    return NextResponse.json(
      {
        user: userObj,
        entries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error in /api/profile.",
      },
      { status: 500 }
    );
  }
}
