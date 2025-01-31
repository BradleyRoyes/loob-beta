import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  if (!params?.userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const collection = await astraDb.collection('usersandloobricates');
    
    // Get user data
    const user = await collection.findOne({
      _id: params.userId.toString(),
      dataType: 'userAccount'
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's connected loobricates
    const connectedLoobricates = await collection.find({
      dataType: 'loobricate',
      $or: [
        { members: params.userId },
        { admins: params.userId }
      ]
    }).toArray();

    return NextResponse.json({
      user,
      connectedLoobricates: connectedLoobricates.map(l => ({
        id: l._id,
        name: l.name,
        description: l.description,
        type: l.type,
        tags: l.tags
      }))
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 