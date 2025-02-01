import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from '@datastax/astra-db-ts';

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

async function getLibraryCollection() {
  try {
    return await astraDb.collection('usersandloobricates');
  } catch (error) {
    console.error('Error accessing library collection:', error);
    throw new Error('Database connection failed.');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { loobricateId: string } }
) {
  const loobricateId = await Promise.resolve(params.loobricateId);

  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const libraryCollection = await getLibraryCollection();

    // Get current loobricate data
    const loobricate = await libraryCollection.findOne({
      _id: loobricateId,
      dataType: 'loobricate'
    });

    if (!loobricate) {
      return NextResponse.json(
        { error: 'Loobricate not found' },
        { status: 404 }
      );
    }

    // Get current user data
    const user = await libraryCollection.findOne({
      _id: userId,
      dataType: 'userAccount'
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize arrays if they don't exist
    const members = loobricate.members || [];
    const connectedLoobricates = user.connectedLoobricates || [];

    let updatedMembers, updatedConnections;

    if (action === 'add') {
      // Add user to loobricate members if not already present
      if (!members.includes(userId)) {
        updatedMembers = [...members, userId];
      } else {
        updatedMembers = members;
      }

      // Add loobricate to user's connections if not already present
      if (!connectedLoobricates.includes(loobricateId)) {
        updatedConnections = [...connectedLoobricates, loobricateId];
      } else {
        updatedConnections = connectedLoobricates;
      }
    } else if (action === 'remove') {
      // Remove user from loobricate members
      updatedMembers = members.filter(id => id !== userId);
      // Remove loobricate from user's connections
      updatedConnections = connectedLoobricates.filter(id => id !== loobricateId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update loobricate document
    const loobricateResult = await libraryCollection.updateOne(
      { _id: loobricateId },
      { 
        $set: { 
          members: updatedMembers,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    // Update user document
    const userResult = await libraryCollection.updateOne(
      { _id: userId },
      { 
        $set: { 
          connectedLoobricates: updatedConnections,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    if (loobricateResult.modifiedCount === 0 || userResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update one or both documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully ${action}ed user to loobricate`,
      members: updatedMembers,
      connectedLoobricates: updatedConnections
    });

  } catch (error) {
    console.error('Error updating loobricate members:', error);
    return NextResponse.json(
      { error: 'Failed to update loobricate members' },
      { status: 500 }
    );
  }
} 