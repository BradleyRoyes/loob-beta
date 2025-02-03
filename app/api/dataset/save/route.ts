import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = Array.from(formData.entries());

  try {
    // Create directory structure
    const publicDir = path.join(process.cwd(), 'public');
    const datasetDir = path.join(publicDir, 'dataset');
    const imagesDir = path.join(datasetDir, 'images');
    const labelsDir = path.join(datasetDir, 'labels');

    // Ensure directories exist
    for (const dir of [publicDir, datasetDir, imagesDir, labelsDir]) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }

    // Process files
    const savedFiles = await Promise.all(
      files.map(async ([name, file]) => {
        if (file instanceof Blob) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const isImage = name === 'images';
          const dir = isImage ? imagesDir : labelsDir;
          
          const filename = file instanceof File ? file.name : `${Date.now()}.${isImage ? 'jpg' : 'txt'}`;
          const filePath = path.join(dir, filename);
          
          // Write file
          await writeFile(filePath, buffer);
          
          return {
            name: filename,
            type: isImage ? 'image' : 'label',
            path: filePath
          };
        }
      })
    );

    return NextResponse.json({ 
      status: 'success',
      files: savedFiles,
      directories: {
        public: publicDir,
        dataset: datasetDir,
        images: imagesDir,
        labels: labelsDir
      }
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? {
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
} 