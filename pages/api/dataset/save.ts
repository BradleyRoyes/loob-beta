import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: join(process.cwd(), 'public/dataset/images'),
      keepExtensions: true,
    });

    // Create directories if they don't exist
    await mkdir(join(process.cwd(), 'public/dataset/images'), { recursive: true });
    await mkdir(join(process.cwd(), 'public/dataset/labels'), { recursive: true });

    // Parse form data
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Get the image and label data
    const imageFile = files.image as formidable.File;
    const label = JSON.parse(fields.label as string);

    // Save label file
    const labelFilename = imageFile.newFilename.replace('.jpg', '.json');
    await writeFile(
      join(process.cwd(), 'public/dataset/labels', labelFilename),
      JSON.stringify(label, null, 2)
    );

    // Update manifest
    const manifestPath = join(process.cwd(), 'public/dataset/manifest.json');
    let manifest = { images: [], labels: [] };
    
    try {
      const manifestContent = await import('../../../public/dataset/manifest.json');
      manifest = manifestContent.default;
    } catch (error) {
      console.log('Creating new manifest file');
    }

    manifest.images.push(imageFile.newFilename);
    manifest.labels.push(labelFilename);

    await writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2)
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving dataset:', error);
    res.status(500).json({ error: 'Failed to save dataset' });
  }
} 