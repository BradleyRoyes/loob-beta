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
    
    // First try to find by pseudonym
    const userDoc = await libraryCollection.findOne({ 
      pseudonym: pseudonym.trim(),
      dataType: 'userAccount'
    });

    if (!userDoc) {
      return handleError('Invalid pseudonym or password.', 401, 'invalid_credentials');
    }

    const passwordMatch = await bcrypt.compare(password, userDoc.password);

    if (!passwordMatch) {
      return handleError('Invalid pseudonym or password.', 401, 'invalid_credentials');
    }

    // Remove sensitive data and ensure required fields
    const { password: _, ...userData } = userDoc;
    
    const safeUserData = {
      _id: userData._id,
      id: userData._id, // Include both for compatibility
      pseudonym: userData.pseudonym,
      email: userData.email || null,
      phone: userData.phone || null,
      connectedLoobricates: userData.connectedLoobricates || [],
      dataType: 'userAccount'
    };

    return NextResponse.json({
      message: 'Login successful.',
      user: safeUserData
    });
    
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return handleError('Internal Server Error', 500, 'internal_error');
  }
}
