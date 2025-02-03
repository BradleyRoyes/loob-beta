import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import nodeFetch from 'node-fetch'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Set up global fetch for Node.js environment
global.fetch = nodeFetch as any;

async function setupStoragePolicies() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables')
    }

    console.log('Setting up storage policies...')
    console.log('Using Supabase URL:', supabaseUrl)

    // Create service role client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    // First, enable RLS on the bucket
    const { error: bucketError } = await supabase
      .storage
      .updateBucket('loob-model-training-data', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        fileSizeLimit: 52428800 // 50MB
      })

    if (bucketError) {
      throw bucketError
    }
    console.log('✅ Bucket settings updated')

    // Test the policies by attempting uploads
    console.log('\nTesting storage access...')
    
    // Create a minimal valid JPEG
    const minimalJPEG = Buffer.from([
      0xFF, 0xD8,                   // SOI marker
      0xFF, 0xE0,                   // APP0 marker
      0x00, 0x10,                   // Length of APP0 segment
      0x4A, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
      0x01, 0x01,                   // Version 1.1
      0x00,                         // Units: none
      0x00, 0x01,                   // X density
      0x00, 0x01,                   // Y density
      0x00, 0x00,                   // Thumbnail size
      0xFF, 0xD9                    // EOI marker
    ])
    
    // Test upload with service role key
    const { error: uploadError } = await supabase
      .storage
      .from('loob-model-training-data')
      .upload('test-policy.jpg', minimalJPEG, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.log('❌ Upload test failed with service role key')
      throw uploadError
    }
    console.log('✅ Upload test successful with service role key')

    // Clean up test file
    await supabase
      .storage
      .from('loob-model-training-data')
      .remove(['test-policy.jpg'])

    console.log('✅ Test file cleaned up')

    // Now test with anon key
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    const { error: anonUploadError } = await anonClient
      .storage
      .from('loob-model-training-data')
      .upload('test-anon.jpg', minimalJPEG, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (anonUploadError) {
      console.log('Note: Anon key upload failed as expected. You will need to use the service role key for uploads.')
      console.log('To enable uploads in your application, make sure to:')
      console.log('1. Use the service role key for the Supabase client when handling uploads')
      console.log('2. Keep the service role key secure and only use it in server-side code')
    } else {
      await anonClient
        .storage
        .from('loob-model-training-data')
        .remove(['test-anon.jpg'])
      console.log('✅ Anonymous uploads are working (this might be a security concern)')
    }

    console.log('\nStorage setup complete!')
    console.log('Make sure to use the service role key when uploading files.')

  } catch (error) {
    console.error('Failed to set up storage:', error)
    process.exit(1)
  }
}

setupStoragePolicies() 