import { NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = Array.from(formData.entries());

  try {
    const publicDir = path.join(process.cwd(), 'public/dataset');
    const imagesDir = path.join(publicDir, 'images');
    const labelsDir = path.join(publicDir, 'labels');

    // Create directories if needed
    [imagesDir, labelsDir].forEach(dir => {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    });

    // Process files
    for (const [name, file] of files) {
      if (file instanceof Blob) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const isImage = name === 'images';
        const dir = isImage ? imagesDir : labelsDir;
        const filename = file instanceof File ? file.name : `${Date.now()}.${isImage ? 'jpg' : 'txt'}`;
        writeFileSync(path.join(dir, filename), buffer);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
} 