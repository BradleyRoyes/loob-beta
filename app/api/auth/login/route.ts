import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

const handleError = (message: string, status: number, code: string = '') => {
  console.error(`[ERROR] ${message}`);
  return NextResponse.json({ error: message, code }, { status });
};

export async function POST(request: NextRequest) {
  try {
    const { pseudonym, password } = await request.json();

    if (!pseudonym || !password) {
      return handleError('Missing pseudonym or password.', 400, 'missing_fields');
    }

    const libraryCollection = await getLibraryCollection();
    const userDoc = await libraryCollection.findOne({ 
      pseudonym,
      dataType: 'userAccount'
    });

    if (!userDoc) {
      return handleError('Invalid pseudonym or password.', 401, 'invalid_credentials');
    }

    const passwordMatch = await bcrypt.compare(password, userDoc.password);

    if (!passwordMatch) {
      return handleError('Invalid pseudonym or password.', 401, 'invalid_credentials');
    }

    // Remove sensitive data before sending
    const { password: _, ...userData } = userDoc;

    console.log('User successfully logged in:', {
      userId: userData._id,
      pseudonym: userData.pseudonym
    });

    // Log full user data for debugging
    console.log('Full user data loaded into GlobalStateContext:', userData);

    return NextResponse.json({
      message: 'Login successful.',
      user: userData
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return handleError('Internal Server Error', 500, 'internal_error');
  }
}
