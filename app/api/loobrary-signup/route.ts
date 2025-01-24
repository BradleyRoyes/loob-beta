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

// Update the validation in POST handler
const validateEntry = (body: any) => {
  const errors: string[] = [];
  
  if (!body.location || !body.latitude || !body.longitude) {
    errors.push('Valid location with coordinates is required');
  }

  if (body.dataType === 'loobricate') {
    if (!body.name?.trim()) errors.push('Loobricate name is required');
    if (!body.adminUsername?.trim()) errors.push('Admin username is required');
    if (!body.adminPassword?.trim()) errors.push('Admin password is required');
  } else {
    if (!body.loobricateId) errors.push('Loobricate ID is required');
    if (!body.title?.trim()) errors.push('Title is required');
  }

  if (!body.description?.trim()) errors.push('Description is required');
  
  return errors;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the entry
    const validationErrors = validateEntry(body);
    if (validationErrors.length > 0) {
      return handleError(
        'Validation failed',
        400,
        'validation_error',
        validationErrors
      );
    }

    // Get the appropriate collection based on data type
    const collection = await getCollection(
      body.dataType === 'loobricate' ? 'usersandloobricates' : 'library'
    );

    // Hash password if it's a Loobricate entry
    if (body.dataType === 'loobricate' && body.adminPassword) {
      body.adminPassword = await bcrypt.hash(body.adminPassword, 10);
    }

    // Insert document
    const result = await collection.insertOne(body);

    return NextResponse.json({
      message: `${body.dataType === 'loobricate' ? 'Loobricate' : 'Entry'} created successfully`,
      id: result.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing request:', error);
    return handleError(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'internal_error'
    );
  }
}
