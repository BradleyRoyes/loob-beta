import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const publicDir = path.join(process.cwd(), 'public/dataset');
    const imagesDir = path.join(publicDir, 'images');
    const labelsDir = path.join(publicDir, 'labels');

    // Clear images directory
    if (fs.existsSync(imagesDir)) {
      fs.readdirSync(imagesDir).forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(imagesDir, file));
        }
      });
    }

    // Clear labels directory
    if (fs.existsSync(labelsDir)) {
      fs.readdirSync(labelsDir).forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(labelsDir, file));
        }
      });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Clear dataset error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
} 