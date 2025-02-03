import { supabase } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function uploadDatasetToSupabase() {
  try {
    console.log('Starting dataset upload to Supabase...');

    // Read manifest
    const manifestPath = path.join(process.cwd(), 'public', 'dataset', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Process each image
    for (const imageInfo of manifest.images) {
      const imagePath = path.join(process.cwd(), 'public', 'dataset', 'images', imageInfo.filename);
      const labelPath = path.join(process.cwd(), 'public', 'dataset', 'labels', 
        imageInfo.filename.replace('.jpg', '.txt'));

      console.log(`Processing ${imageInfo.filename}...`);

      // Read image and label files
      const imageFile = fs.readFileSync(imagePath);
      const labelData = fs.existsSync(labelPath) 
        ? fs.readFileSync(labelPath, 'utf8')
        : null;

      // Upload image to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('dataset-images')
        .upload(`images/${imageInfo.filename}`, imageFile, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (storageError) {
        console.error(`Error uploading ${imageInfo.filename}:`, storageError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('dataset-images')
        .getPublicUrl(`images/${imageInfo.filename}`);

      // Insert into database
      const { error: dbError } = await supabase
        .from('dataset')
        .upsert({
          filename: imageInfo.filename,
          url: publicUrl,
          label_data: labelData ? { content: labelData } : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'filename'
        });

      if (dbError) {
        console.error(`Error inserting ${imageInfo.filename}:`, dbError);
        continue;
      }

      console.log(`Successfully uploaded ${imageInfo.filename}`);
    }

    console.log('Dataset upload completed!');
  } catch (error) {
    console.error('Error uploading dataset:', error);
    process.exit(1);
  }
}

// Run the upload
uploadDatasetToSupabase(); 