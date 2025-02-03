import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import nodeFetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Set up global fetch for Node.js environment
global.fetch = nodeFetch as any;

async function setupSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('Setting up Supabase database...');
    console.log('Using Supabase URL:', supabaseUrl);

    // Create service role client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // Test if table exists by trying to select from it
    const { error: testError } = await supabase
      .from('dataset')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('Dataset table does not exist. Creating...');
      
      // Create initial record to create table with correct schema
      const { error: createError } = await supabase
        .from('dataset')
        .insert({
          filename: '_schema.json',
          url: 'schema_placeholder',
          file_size: 0,
          label_data: {
            content: '',
            format: 'yolo',
            timestamp: Date.now(),
            frame_index: 0
          },
          metadata: {},
          status: 'active'
        });

      if (createError) {
        throw createError;
      }

      // Clean up schema record
      await supabase
        .from('dataset')
        .delete()
        .eq('filename', '_schema.json');

      console.log('✅ Dataset table created successfully');
    } else {
      console.log('✅ Dataset table already exists');
    }

    // Test the table by inserting a dummy record
    const testData = {
      filename: 'test.jpg',
      url: 'https://example.com/test.jpg',
      file_size: 1024,
      label_data: {
        content: '0 0.5 0.5 0.1 0.1',
        format: 'yolo',
        timestamp: Date.now(),
        frame_index: 0
      }
    };

    const { error: insertError } = await supabase
      .from('dataset')
      .insert(testData);

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Test record inserted successfully');

    // Clean up test data
    const { error: deleteError } = await supabase
      .from('dataset')
      .delete()
      .match({ filename: 'test.jpg' });

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Test record cleaned up');
    console.log('\nDatabase setup complete! You can now use the dataset table.');

  } catch (error) {
    console.error('Failed to set up database:', error);
    process.exit(1);
  }
}

setupSupabase(); 