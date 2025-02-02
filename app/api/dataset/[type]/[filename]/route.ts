import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { type: string; filename: string } }
) {
  try {
    // Await params at the start to prevent Next.js warnings
    const type = await Promise.resolve(params.type);
    const filename = await Promise.resolve(params.filename);

    if (!['images', 'labels'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const filePath = path.join(
      process.cwd(),
      'public',
      'dataset',
      type,
      filename
    );

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return NextResponse.json({ 
        error: 'File not found',
        path: filePath,
        exists: false
      }, { status: 404 });
    }

    const content = fs.readFileSync(filePath);
    
    if (type === 'labels') {
      return NextResponse.json({ content: content.toString() });
    } else {
      // For images, return the file with proper headers
      const response = new NextResponse(content, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': content.length.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      });
      return response;
    }
  } catch (error) {
    console.error('File access error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 