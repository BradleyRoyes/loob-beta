import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '../../../lib/astraDb';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Text splitter configuration
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// Utility function for handling errors
const handleError = (message: string, status: number, code: string = '', missingFields: string[] = []) => {
  console.error(`[ERROR]: ${message}`);
  return NextResponse.json({ error: message, code, missingFields }, { status });
};

// Validate tags: Ensure each tag has both `category` and `value`
const validateTags = (tags: string[]) => {
  if (!tags || !Array.isArray(tags)) return false;
  return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields based on type
    const requiredFields = ['dataType'];
    if (body.dataType === 'loobricate') {
      requiredFields.push('name', 'description', 'addressLine1', 'city', 'adminUsername');
    } else {
      requiredFields.push('title', 'description', 'location', 'loobricates');
    }

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 });
    }

    // Validate tags for all entries
    if (!validateTags(body.tags)) {
      return handleError('Invalid tags. Each tag must have a category and value.', 400, 'invalid_tags');
    }

    // Hash password if present
    if (body.adminPassword) {
      body.adminPassword = await bcrypt.hash(body.adminPassword, 10);
    }

    // Combine address fields for Loobricate
    if (body.dataType === 'loobricate') {
      body.address = `${body.addressLine1}, ${body.city}`;
      // Add creator as first admin and member
      body.admins = [body.creatorId];
      body.members = [body.creatorId];
    }

    // Get collection
    const collection = await getCollection('usersandloobricates');

    // Add timestamp
    body.createdAt = new Date();

    // Insert document
    const result = await collection.insertOne(body);

    // If this is a loobricate creation, update the user's document to include this loobricate
    if (body.dataType === 'loobricate' && body.creatorId) {
      await collection.updateOne(
        { _id: body.creatorId },
        { 
          $push: { 
            loobricates: {
              id: result.insertedId,
              name: body.name,
              role: 'admin'
            }
          }
        }
      );
    }

    return NextResponse.json({
      message: `${body.dataType === 'loobricate' ? 'Loobricate' : 'Entry'} created successfully`,
      id: result.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
