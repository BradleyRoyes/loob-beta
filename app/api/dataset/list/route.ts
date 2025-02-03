import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const imagesDir = path.join(process.cwd(), 'public', 'dataset', 'images');
    
    // Ensure directories exist
    if (!fs.existsSync(imagesDir)) {
      return NextResponse.json({ images: [] });
    }

    // Get all jpg files
    const images = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.jpg'))
      // Make sure corresponding label file exists
      .filter(file => {
        const labelPath = path.join(
          process.cwd(), 
          'public', 
          'dataset', 
          'labels', 
          file.replace('.jpg', '.txt')
        );
        return fs.existsSync(labelPath);
      });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing dataset:', error);
    return NextResponse.json(
      { error: 'Failed to list dataset files' },
      { status: 500 }
    );
  }
} 