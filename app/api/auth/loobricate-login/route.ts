import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '../../../../lib/astraDb';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    console.log('Login attempt for username:', username);

    // Input validation
    if (!username || !password) {
      console.error('Missing credentials:', { username: !!username, password: !!password });
      return NextResponse.json({ 
        error: 'Username and password are required',
        details: 'Both fields must be filled out'
      }, { status: 400 });
    }

    const collection = await getCollection('usersandloobricates');
    
    // Find the loobricate with matching admin credentials
    const loobricate = await collection.findOne({
      dataType: 'loobricate',
      adminUsername: username
    });

    if (!loobricate) {
      console.error('No loobricate found with username:', username);
      return NextResponse.json({ 
        error: 'Invalid credentials',
        details: 'No loobricate found with this username'
      }, { status: 401 });
    }

    console.log('Found loobricate:', {
      id: loobricate._id,
      name: loobricate.name,
      hasPassword: !!loobricate.adminPassword
    });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, loobricate.adminPassword);
    
    if (!isValidPassword) {
      console.error('Invalid password for username:', username);
      return NextResponse.json({ 
        error: 'Invalid credentials',
        details: 'Password is incorrect'
      }, { status: 401 });
    }

    console.log('Login successful for loobricate:', loobricate.name);

    return NextResponse.json({
      message: 'Login successful',
      loobricate: {
        id: loobricate._id,
        name: loobricate.name,
        description: loobricate.description,
        address: loobricate.address,
        admins: loobricate.admins || [],
        members: loobricate.members || [],
        createdAt: loobricate.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 