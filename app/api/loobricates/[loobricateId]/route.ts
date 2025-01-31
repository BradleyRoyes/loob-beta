import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from '@datastax/astra-db-ts';

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

async function getCollection() {
  try {
    return await astraDb.collection('usersandloobricates');
  } catch (error) {
    console.error('Error accessing collection:', error);
    throw new Error('Database connection failed');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { loobricateId: string } }
) {
  if (!params?.loobricateId) {
    return NextResponse.json({ error: 'Loobricate ID is required' }, { status: 400 });
  }

  try {
    const collection = await getCollection();
    const loobricate = await collection.findOne({
      _id: params.loobricateId.toString(),
      dataType: 'loobricate'
    });

    if (!loobricate) {
      return NextResponse.json({ error: 'Loobricate not found' }, { status: 404 });
    }

    return NextResponse.json(loobricate);
  } catch (error) {
    console.error('Error fetching loobricate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loobricate' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { loobricateId: string } }
) {
  try {
    const collection = await getCollection();
    const updates = await request.json();

    // Ensure we're only updating allowed fields
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      addressLine1: updates.addressLine1,
      city: updates.city,
      adminUsername: updates.adminUsername,
      tags: updates.tags,
      type: updates.type,
      members: updates.members,
      admins: updates.admins,
      updatedAt: new Date().toISOString()
    };

    // Update the loobricate
    const result = await collection.updateOne(
      { 
        _id: params.loobricateId,
        dataType: 'loobricate'
      },
      { $set: allowedUpdates }
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: 'Loobricate not found' },
        { status: 404 }
      );
    }

    // Update the connectedLoobricates array for each member and admin
    const allUsers = [...new Set([...updates.members, ...updates.admins])];
    
    for (const username of allUsers) {
      await collection.updateOne(
        { pseudonym: username, dataType: 'userAccount' },
        { 
          $addToSet: { 
            connectedLoobricates: {
              id: params.loobricateId,
              name: updates.name,
              type: updates.type || 'community',
              role: updates.admins.includes(username) ? 'admin' : 'member'
            }
          },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }

    // Fetch and return the updated document
    const updated = await collection.findOne({
      _id: params.loobricateId,
      dataType: 'loobricate'
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating loobricate:', error);
    return NextResponse.json(
      { error: 'Failed to update loobricate' },
      { status: 500 }
    );
  }
} 