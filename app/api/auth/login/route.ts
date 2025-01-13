import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password comparison
import { AstraDB, Collection } from '@datastax/astra-db-ts';

// 1) Initialize AstraDB
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

// 2) Helper to get the "library" collection
async function getLibraryCollection(): Promise<Collection> {
  try {
    return await astraDb.collection('library');
  } catch (error) {
    console.error('Error accessing library collection:', error);
    throw new Error('Database connection failed.');
  }
}

// 3) Error handling utility function
const handleError = (message: string, status: number, code: string = '') => {
  console.error(`[ERROR] ${message}`);
  return NextResponse.json({ error: message, code }, { status });
};

// ---------------------------
// POST: Check user login
// ---------------------------
export async function POST(request: NextRequest) {
  try {
    const { pseudonym, password } = await request.json();

    // Basic checks for empty fields
    if (!pseudonym || !password) {
      return handleError('Missing pseudonym or password.', 400, 'missing_fields');
    }

    // Access the "library" collection
    const libraryCollection = await getLibraryCollection();

    // Look up the user document by pseudonym
    const userDoc = await libraryCollection.findOne({ pseudonym });

    if (!userDoc) {
      // No user found with that pseudonym
      return handleError('User not found.', 401, 'user_not_found');
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, userDoc.password);

    if (!passwordMatch) {
      return handleError('Invalid password.', 401, 'invalid_password');
    }

    // If login is successful, return user information (excluding password)
    return NextResponse.json(
      {
        message: 'Login successful.',
        user: {
          pseudonym: userDoc.pseudonym,
          email: userDoc.email,
          phone: userDoc.phone,
          // You can add more user fields as needed
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return handleError('Internal Server Error', 500, 'internal_error');
  }
}
