import { NextRequest, NextResponse } from 'next/server';
import { AstraDB } from "@datastax/astra-db-ts";
import bcrypt from 'bcryptjs';

const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN!,
  process.env.ASTRA_DB_ENDPOINT!,
  process.env.ASTRA_DB_NAMESPACE!
);

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Missing credentials',
        details: 'Username and password are required'
      }, { status: 400 });
    }

    const collection = await astraDb.collection('usersandloobricates');
    
    const loobricate = await collection.findOne({
      dataType: 'loobricate',
      adminUsername: username
    });

    if (!loobricate) {
      return NextResponse.json({ 
        error: 'Invalid credentials',
        details: 'No loobricate found with this username'
      }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, loobricate.adminPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        error: 'Invalid credentials',
        details: 'Invalid password'
      }, { status: 401 });
    }

    return NextResponse.json({
      loobricate: {
        _id: loobricate._id,
        name: loobricate.name,
        description: loobricate.description,
        addressLine1: loobricate.addressLine1,
        city: loobricate.city,
        adminUsername: loobricate.adminUsername,
        tags: loobricate.tags || [],
        admins: loobricate.admins || [],
        members: loobricate.members || [],
        createdAt: loobricate.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 