import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import nodeFetch from 'node-fetch'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Set up global fetch for Node.js environment
global.fetch = nodeFetch as any;

async function testSupabaseSetup() {
  try {
    // Test Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    console.log('\nTesting Supabase connection...')
    console.log('Using Supabase URL:', supabaseUrl)
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    // Create regular client for data access
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    // Test Supabase query
    try {
      const { data, error: queryError } = await supabase
        .from('dataset')
        .select('*', { count: 'exact' })
        .limit(1)

      if (queryError) throw queryError
      console.log('✅ Supabase connection successful')
      console.log('Query result:', data)
    } catch (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        details: error,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    // Test storage bucket access with Supabase Storage API
    try {
      console.log('\nTesting storage with Supabase Storage API...')
      console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...')
      
      // Create a service role client for storage operations
      const serviceRoleClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      })

      // List buckets using Storage API
      console.log('Attempting to list buckets...')
      const { data: buckets, error: listError } = await serviceRoleClient
        .storage
        .listBuckets()

      if (listError) {
        console.error('List buckets error:', listError)
        throw listError
      }
      console.log('✅ Storage API access successful')
      console.log('Available buckets:', buckets)

      // Check for loob-model-training-data bucket
      const trainingBucket = buckets?.find(b => b.name === 'loob-model-training-data')
      if (!trainingBucket) {
        console.log('Creating loob-model-training-data bucket...')
        const { error: createError } = await serviceRoleClient
          .storage
          .createBucket('loob-model-training-data', {
            public: false,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/jpeg', 'image/png']
          })

        if (createError) {
          console.error('Create bucket error:', createError)
          throw createError
        }
        console.log('✅ Training data bucket created successfully')
      } else {
        console.log('✅ Training data bucket exists')
      }

      // Test file upload
      console.log('Testing file upload...')
      const testBuffer = Buffer.from('test')
      const { data: uploadData, error: uploadError } = await serviceRoleClient
        .storage
        .from('loob-model-training-data')
        .upload('test.txt', testBuffer, {
          contentType: 'text/plain',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }
      console.log('Upload response:', uploadData)
      console.log('✅ Test file upload successful')

      // Clean up test file
      console.log('Cleaning up test file...')
      const { error: removeError } = await serviceRoleClient
        .storage
        .from('loob-model-training-data')
        .remove(['test.txt'])

      if (removeError) {
        console.error('Remove error:', removeError)
        throw removeError
      }
      console.log('✅ Test file cleanup successful')

    } catch (error) {
      console.error('Storage test failed:', {
        message: error.message,
        details: error,
        hint: error.hint,
        code: error.code,
        name: error.name,
        stack: error.stack
      })
      throw error
    }

    console.log('\n✅ All tests passed!')
  } catch (error) {
    console.error('\n❌ Test failed:', {
      message: error.message,
      details: error.toString(),
      hint: error.hint,
      code: error.code
    })
    process.exit(1)
  }
}

testSupabaseSetup() 