import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";

// Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

export async function GET() {
  try {
    const collection = await astraDb.collection('usersandloobricates');
    
    // Fetch all documents where dataType is 'loobricate'
    const loobricates = await collection.find({
      dataType: 'loobricate'
    }).toArray();

    // Map to return fields needed by both ChatModal and Map components
    const formattedLoobricates = loobricates.map(loobricate => ({
      id: loobricate._id,
      name: loobricate.name || loobricate.title || "Unnamed Loobricate",
      description: loobricate.description || "",
      address: loobricate.address || `${loobricate.addressLine1}, ${loobricate.city}`,
      adminUsername: loobricate.adminUsername,
      tags: loobricate.tags || [],
      email: loobricate.email,
      location: loobricate.location || loobricate.address || `${loobricate.addressLine1}, ${loobricate.city}`,
      createdAt: loobricate.createdAt,
      updatedAt: loobricate.updatedAt
    }));

    return NextResponse.json(formattedLoobricates);
  } catch (error) {
    console.error('Error fetching Loobricates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Loobricates' }, 
      { status: 500 }
    );
  }
} 