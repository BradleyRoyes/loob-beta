import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const datasetDir = path.join(process.cwd(), 'public', 'dataset');
    const manifestPath = path.join(datasetDir, 'manifest.json');
    
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    return NextResponse.json(manifest);
  } catch (error) {
    console.error('Error loading manifest:', error);
    return NextResponse.json(
      { error: 'Failed to load manifest' },
      { status: 500 }
    );
  }
} 