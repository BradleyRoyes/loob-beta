import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    },
    global: {
      fetch: fetch as unknown as typeof globalThis.fetch
    }
  }
);

export interface DatasetImage {
  id: string;
  filename: string;
  url: string;
  label_data: any;
  created_at: string;
}

export interface DatasetLabel {
  id: string;
  image_id: string;
  data: any;
  created_at: string;
}

export async function uploadDataset(
  images: File[],
  labels: { [key: string]: any }
): Promise<{ success: boolean; message: string }> {
  try {
    for (const image of images) {
      // Upload image to Supabase Storage
      const { data: imageData, error: imageError } = await supabase.storage
        .from('dataset-images')
        .upload(`images/${image.name}`, image);

      if (imageError) throw imageError;

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('dataset-images')
        .getPublicUrl(`images/${image.name}`);

      // Create dataset entry in the database
      const { error: dbError } = await supabase
        .from('dataset')
        .insert({
          filename: image.name,
          url: publicUrl,
          label_data: labels[image.name.replace('.jpg', '.txt')] || null
        });

      if (dbError) throw dbError;
    }

    return { success: true, message: 'Dataset uploaded successfully' };
  } catch (error) {
    console.error('Error uploading dataset:', error);
    return { success: false, message: error.message };
  }
}

export async function getDataset(): Promise<DatasetImage[]> {
  const { data, error } = await supabase
    .from('dataset')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteDatasetImage(id: string): Promise<void> {
  const { data: image } = await supabase
    .from('dataset')
    .select('filename')
    .eq('id', id)
    .single();

  if (image) {
    // Delete from storage
    await supabase.storage
      .from('dataset-images')
      .remove([`images/${image.filename}`]);

    // Delete from database
    await supabase
      .from('dataset')
      .delete()
      .eq('id', id);
  }
}

export async function updateDatasetLabel(
  imageId: string,
  labelData: any
): Promise<void> {
  const { error } = await supabase
    .from('dataset')
    .update({ label_data: labelData })
    .eq('id', imageId);

  if (error) throw error;
}

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('dataset')
      .select('*')
      .limit(1)
    
    if (error) throw error
    return { success: true, message: 'Connected to Supabase successfully' }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return { 
      success: false, 
      message: 'Failed to connect to Supabase',
      error: error instanceof Error ? error.message : String(error)
    }
  }
} 