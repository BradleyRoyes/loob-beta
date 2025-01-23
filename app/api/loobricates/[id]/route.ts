import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../../lib/astraDb';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const loobricate = await db.collection('loobricates').findOne({
      _id: new ObjectId(params.id)
    });

    if (!loobricate) {
      return NextResponse.json(
        { error: 'Loobricate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(loobricate);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch loobricate' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Validate required fields
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Update document
    const result = await db.collection('loobricates').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          name: body.name,
          description: body.description,
          addressLine1: body.addressLine1,
          city: body.city,
          tags: body.tags,
          updatedAt: new Date(),
        }
      }
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: 'Loobricate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Loobricate updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update loobricate' },
      { status: 500 }
    );
  }
} 