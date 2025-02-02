import { NextApiRequest, NextApiResponse } from 'next';
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the images and labels directories
    const imagesDir = join(process.cwd(), 'public/dataset/images');
    const labelsDir = join(process.cwd(), 'public/dataset/labels');

    const [imageFiles, labelFiles] = await Promise.all([
      readdir(imagesDir),
      readdir(labelsDir)
    ]);

    // Filter out .DS_Store and other hidden files
    const images = imageFiles.filter(file => 
      file.endsWith('.jpg') && !file.startsWith('.')
    ).sort();
    
    const labels = labelFiles.filter(file => 
      file.endsWith('.txt') && !file.startsWith('.')
    ).sort();

    // Create manifest
    const manifest = {
      images,
      labels: labels.map(label => label)
    };

    // Save manifest
    const manifestPath = join(process.cwd(), 'public/dataset/manifest.json');
    await writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2)
    );

    res.status(200).json({ 
      success: true,
      imageCount: images.length,
      labelCount: labels.length
    });
  } catch (error) {
    console.error('Error updating manifest:', error);
    res.status(500).json({ error: 'Failed to update manifest' });
  }
} 