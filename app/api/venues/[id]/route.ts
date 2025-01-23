import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../../lib/astraDb';

interface RouteParams {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const collection = await getCollection('usersandloobricates');
    
    const venue = await collection.findOne({
      _id: context.params.id,
      $or: [
        { dataType: 'location' },
        { offeringType: 'location' }
      ]
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
  }
} 