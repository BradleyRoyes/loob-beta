import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Use OpenStreetMap's Nominatim service for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Loob Beta (loob-beta.vercel.app)', // Updated with correct URL
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Return the coordinates
    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
} 