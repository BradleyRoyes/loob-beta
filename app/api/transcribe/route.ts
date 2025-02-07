import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
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

// Initialize OpenAI with error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🎤 Starting new transcription request...');

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

    try {
      console.log('🎯 Starting transcription...');
      
      // Convert File to Blob
      const arrayBuffer = await audioFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: audioFile.type || 'audio/webm' });
      
      // Create a File object that OpenAI can handle
      const file = new File([blob], audioFile.name || 'audio.webm', {
        type: audioFile.type || 'audio/webm'
      });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        response_format: 'json',
        temperature: 0.3,
        language: 'en'
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
  }
} 