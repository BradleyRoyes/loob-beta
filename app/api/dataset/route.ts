import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const datasetDir = path.join(publicDir, 'dataset');
    const imagesDir = path.join(datasetDir, 'images');
    const labelsDir = path.join(datasetDir, 'labels');

    // Create directories if they don't exist
    [datasetDir, imagesDir, labelsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Get file listings
    const imageFiles = fs.existsSync(imagesDir) 
      ? fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'))
      : [];
    
    const labelFiles = fs.existsSync(labelsDir)
      ? fs.readdirSync(labelsDir).filter(f => f.endsWith('.txt'))
      : [];

    return NextResponse.json({
      status: 'success',
      directories: {
        dataset: fs.existsSync(datasetDir),
        images: fs.existsSync(imagesDir),
        labels: fs.existsSync(labelsDir)
      },
      files: {
        images: imageFiles,
        labels: labelFiles
      }
    });
  } catch (error) {
    console.error('Dataset API Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
} 