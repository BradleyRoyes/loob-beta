import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    const publicDir = path.join(process.cwd(), 'public');
    const datasetDir = path.join(publicDir, 'dataset');
    const imagesDir = path.join(datasetDir, 'images');
    const labelsDir = path.join(datasetDir, 'labels');

    const results = await Promise.all(
      files.map(async (file) => {
        const isImage = file.name.endsWith('.jpg');
        const targetDir = isImage ? imagesDir : labelsDir;
        const filePath = path.join(targetDir, file.name);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        return {
          name: file.name,
          type: isImage ? 'image' : 'label',
          size: file.size
        };
      })
    );

    return NextResponse.json({
      status: 'success',
      files: results
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
} 