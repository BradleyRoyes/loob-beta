import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '../../../lib/astraDb';

// Utility function for handling errors
const handleError = (message: string, status: number, code: string = '', missingFields: string[] = []) => {
  console.error(`[ERROR]: ${message}`);
  return NextResponse.json({ error: message, code, missingFields }, { status });
};

export async function POST(req: NextRequest) {
  try {
    console.log('Processing signup request...');
    const body = await req.json();
    const { pseudonym, email, phone, password } = body;

    // Validate required fields
    const missingFields: string[] = [];
    if (!pseudonym) missingFields.push('pseudonym');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      return handleError(
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'missing_fields',
        missingFields
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return handleError('Invalid email format.', 400, 'invalid_email');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the collection
    const collection = await getCollection('usersandloobricates');

    // Check for duplicate email or pseudonym
    const duplicate = await collection.findOne({
      $or: [{ email }, { pseudonym }],
    });

    if (duplicate) {
      return handleError('An account with this email or pseudonym already exists.', 400, 'duplicate_account');
    }

    // Insert the new user
    const userDocument = {
      pseudonym,
      email,
      phone: phone || 'N/A',
      password: hashedPassword,
      dataType: 'userAccount',
      createdAt: new Date().toISOString(),
    };

    await collection.insertOne(userDocument);

    console.log('User signup successful.');
    return NextResponse.json({ message: 'Account created successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error processing signup:', error);
    return handleError('Internal server error.', 500, 'internal_error');
  }
}
