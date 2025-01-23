import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../lib/astraDb';

export async function GET() {
  try {
    const collection = await getCollection('usersandloobricates');
    
    // Fetch all documents where dataType is 'loobricate'
    const loobricates = await collection.find({
      dataType: 'loobricate'
    }).toArray();

    // Map to return only necessary fields
    const formattedLoobricates = loobricates.map(loobricate => ({
      id: loobricate._id,
      name: loobricate.name || loobricate.title,
      description: loobricate.description,
      address: `${loobricate.addressLine1}, ${loobricate.city}`,
      adminUsername: loobricate.adminUsername,
      tags: loobricate.tags || []
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