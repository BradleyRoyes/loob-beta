import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../lib/astraDb';

export async function GET(req: NextRequest) {
  try {
    const collection = await getCollection('usersandloobricates');
    
    const loobricates = await collection.find({
      dataType: 'loobricate'
    }).toArray();

    // Return only necessary fields
    const simplifiedLoobricates = loobricates.map(({ _id, name }) => ({
      id: _id,
      name
    }));

    return NextResponse.json(simplifiedLoobricates);
  } catch (error) {
    console.error('Error fetching Loobricates:', error);
    return NextResponse.json({ error: 'Failed to fetch Loobricates' }, { status: 500 });
  }
} 