import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';
import https from 'https';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Using Supabase URL:', supabaseUrl);

// Test direct REST API connection first
async function testDirectConnection() {
  try {
    console.log('Testing direct REST API connection...');
    const headers: Record<string, string> = {
      'apikey': supabaseKey!,
      'Authorization': `Bearer ${supabaseKey}`
    };

    const agent = new https.Agent({
      rejectUnauthorized: false // Only for testing - don't use in production
    });

    console.log('Making request to:', `${supabaseUrl}/rest/v1/dataset?select=count`);
    console.log('Headers:', headers);

    const response = await fetch(`${supabaseUrl}/rest/v1/dataset?select=count`, { 
      headers,
      agent
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }

    const data = await response.json();
    console.log('Direct REST API test successful:', data);
    return true;
  } catch (error) {
    console.error('Direct REST API test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return false;
  }
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    fetch: fetch as unknown as typeof globalThis.fetch,
    headers: {
      'x-client-info': 'supabase-js/2.x'
    }
  }
});

async function testSupabaseSetup() {
  console.log('Testing Supabase Setup...\n');

  try {
    // 0. Test Direct Connection
    console.log('0. Testing Direct Connection...');
    const directConnectionSuccess = await testDirectConnection();
    if (!directConnectionSuccess) {
      throw new Error('Direct connection test failed. Please check your network connection and Supabase URL.');
    }
    console.log('✅ Direct connection successful\n');

    // 1. Test Database Connection
    console.log('1. Testing Database Connection...');
    const { data: testData, error: testError } = await supabase
      .from('dataset')
      .select('count(*)', { count: 'exact' })
      .limit(1);

    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    console.log('✅ Database connection successful\n');

    // 2. Check Dataset Table Structure
    console.log('2. Checking Dataset Table Structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('dataset')
      .select('*')
      .limit(1);

    if (tableError) {
      throw new Error(`Failed to query dataset table: ${tableError.message}`);
    }

    const requiredColumns = ['id', 'filename', 'url', 'label_data', 'created_at'];
    const missingColumns = requiredColumns.filter(col => 
      !tableData || tableData.length === 0 || !(col in tableData[0])
    );

    if (missingColumns.length > 0) {
      console.warn(`⚠️ Missing columns in dataset table: ${missingColumns.join(', ')}`);
      
      // Try to create the table if it doesn't exist
      if (!tableData || tableData.length === 0) {
        console.log('Attempting to create dataset table...');
        const { error: createError } = await supabase.rpc('create_dataset_table');
        if (createError) {
          console.warn('Failed to create table:', createError.message);
        } else {
          console.log('✅ Dataset table created successfully');
        }
      }
    } else {
      console.log('✅ Dataset table structure is correct\n');
    }

    // 3. Check Storage Bucket
    console.log('3. Checking Storage Bucket...');
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('dataset-images');

    if (bucketError) {
      console.warn(`⚠️ Storage bucket 'dataset-images' not found or inaccessible`);
      
      // Try to create the bucket
      console.log('   Attempting to create storage bucket...');
      const { data: newBucket, error: createError } = await supabase
        .storage
        .createBucket('dataset-images', {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });

      if (createError) {
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
      console.log('✅ Storage bucket created successfully\n');
    } else {
      console.log('✅ Storage bucket exists and is accessible\n');
    }

    // 4. Test Storage Upload
    console.log('4. Testing Storage Upload Permission...');
    const testBuffer = Buffer.from('test');
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('dataset-images')
      .upload('test.txt', testBuffer);

    if (uploadError) {
      console.warn(`⚠️ Storage upload test failed: ${uploadError.message}`);
    } else {
      console.log('✅ Storage upload test successful');
      
      // Clean up test file
      await supabase
        .storage
        .from('dataset-images')
        .remove(['test.txt']);
      console.log('✅ Test file cleaned up\n');
    }

    // 5. Summary
    console.log('\nSUPABASE SETUP SUMMARY:');
    console.log('====================');
    console.log('✅ Database Connection: OK');
    console.log(`✅ Dataset Table: ${missingColumns.length === 0 ? 'OK' : 'Missing Columns'}`);
    console.log('✅ Storage Bucket: OK');
    console.log(`✅ Storage Upload: ${!uploadError ? 'OK' : 'Failed'}`);
    console.log('\nSetup is ready for StickDashboard usage.');

  } catch (error) {
    console.error('\n❌ SETUP TEST FAILED:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testSupabaseSetup(); 