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

export async function GET(request: NextRequest) {
  try {
    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const libraryCollection = await getLibraryCollection();
    
    // Find all users with dataType userAccount
    const users = await libraryCollection.find({
      dataType: 'userAccount'
    }).toArray();

    // Filter and map users client-side
    const userList = users
      .filter(user => user.pseudonym.toLowerCase().startsWith(query))
      .map(user => ({
        id: user._id,
        pseudonym: user.pseudonym
      }))
      .slice(0, 10); // Limit to 10 results

    return NextResponse.json({ users: userList });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 