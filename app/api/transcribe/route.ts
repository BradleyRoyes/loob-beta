import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

// Helper to get file extension from MIME type
function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/webm;codecs=opus': 'webm'  // Add explicit support for opus codec
  };
  return mimeToExt[mimeType] || 'webm';
}

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export async function POST(request: NextRequest) {
  console.log('🎤 Starting new transcription request...');
  const tempFiles: string[] = [];

  try {
    // Log request details for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Request headers:', {
      ...headers,
      'content-type': request.headers.get('content-type')
    });

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('❌ No audio file received in request');
      return NextResponse.json(
        { error: 'No audio file received.' },
        { status: 400 }
      );
    }

    // Enhanced file logging
    const fileDetails = {
      name: audioFile.name || 'unnamed',
      size: audioFile.size,
      type: audioFile.type || 'audio/webm',
      lastModified: new Date(audioFile.lastModified).toISOString()
    };
    
    console.log('📦 Received audio file:', fileDetails);

    // Validate file size and type
    if (audioFile.size === 0) {
      console.error('❌ Empty audio file received');
      return NextResponse.json(
        { error: 'Audio file is empty.', details: fileDetails },
        { status: 400 }
      );
    }

    if (audioFile.size > 25 * 1024 * 1024) { // 25MB limit
      console.error('❌ File too large:', audioFile.size);
      return NextResponse.json(
        { error: 'Audio file too large (max 25MB).', details: fileDetails },
        { status: 400 }
      );
    }

    // Get appropriate file extension based on MIME type
    const fileExt = getFileExtension(audioFile.type || 'audio/webm');
    const uniqueId = uuidv4();
    const audioPath = join(tmpdir(), `audio_${uniqueId}.${fileExt}`);
    tempFiles.push(audioPath);

    // Write the uploaded file to disk
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('📝 Writing audio file:', {
      path: audioPath,
      size: buffer.length,
      extension: fileExt,
      details: fileDetails
    });

    await writeFile(audioPath, buffer);
    console.log('✅ Audio file written to disk:', audioPath);

    try {
      // Initialize OpenAI with error handling
      console.log('🤖 Initializing OpenAI API...');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Always use the file from disk approach for consistency
      console.log('🎯 Starting transcription...');
      const fileHandle = await import('node:fs').then(fs => 
        fs.createReadStream(audioPath)
      );

      const transcription = await openai.audio.transcriptions.create({
        file: fileHandle as any,
        model: 'whisper-1',
        response_format: 'json',
        temperature: 0.3,
        language: 'en'  // Explicitly set language to English
      });

      console.log('✅ Transcription successful:', {
        text: transcription.text,
        fileDetails
      });
      
      return NextResponse.json({ 
        transcription: transcription.text,
        fileDetails
      });
    } catch (error: any) {
      console.error('❌ Transcription error:', {
        message: error.message,
        stack: error.stack,
        details: error,
        fileDetails
      });

      // More specific error messages
      let errorMessage = 'Error during transcription';
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key error';
      } else if (error.message.includes('format')) {
        errorMessage = 'Unsupported audio format';
      }

      return NextResponse.json(
        { 
          error: errorMessage, 
          details: error.message,
          fileDetails,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Request handling error:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    return NextResponse.json(
      { 
        error: 'Error processing request', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    // Clean up temporary files
    console.log('🧹 Cleaning up temporary files...');
    for (const file of tempFiles) {
      try {
        await unlink(file);
        console.log('✅ Deleted temporary file:', file);
      } catch (error: any) {
        console.error('❌ Error deleting temporary file:', file, {
          message: error.message,
          code: error.code
        });
      }
    }
  }
} 