import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from '@datastax/astra-db-ts';

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = await Promise.resolve(params.userId);

  try {
    const { loobricateId, action } = await request.json();

    if (!loobricateId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const libraryCollection = await astraDb.collection('usersandloobricates');
    
    // Get current user data
    const userDoc = await libraryCollection.findOne({
      _id: userId,
      dataType: 'userAccount'
    });

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get loobricate data to verify it exists
    const loobricateDoc = await libraryCollection.findOne({
      _id: loobricateId,
      dataType: 'loobricate'
    });

    if (!loobricateDoc) {
      return NextResponse.json(
        { error: 'Loobricate not found' },
        { status: 404 }
      );
    }

    // Initialize connectedLoobricates if it doesn't exist
    const connectedLoobricates = userDoc.connectedLoobricates || [];

    let updatedConnections;
    if (action === 'add') {
      // Add loobricate if not already connected
      if (!connectedLoobricates.includes(loobricateId)) {
        updatedConnections = [...connectedLoobricates, loobricateId];
      } else {
        updatedConnections = connectedLoobricates;
      }
    } else if (action === 'remove') {
      // Remove loobricate if connected
      updatedConnections = connectedLoobricates.filter(id => id !== loobricateId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update user document
    const result = await libraryCollection.updateOne(
      { _id: userId },
      { $set: { connectedLoobricates: updatedConnections } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update user connections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully ${action}ed loobricate connection`,
      connectedLoobricates: updatedConnections
    });
  } catch (error) {
    console.error('Error updating user loobricates:', error);
    return NextResponse.json(
      { error: 'Failed to update user loobricates' },
      { status: 500 }
    );
  }
} 