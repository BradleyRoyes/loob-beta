import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  console.log('🎤 Starting new transcription request...');
  const tempFiles: string[] = [];

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('❌ No audio file received in request');
      return NextResponse.json(
        { error: 'No audio file received.' },
        { status: 400 }
      );
    }

    console.log('📦 Received audio file:', audioFile.name, 'Size:', audioFile.size, 'bytes');

    // Create a temporary file path for the audio
    const uniqueId = uuidv4();
    const audioPath = join(tmpdir(), `audio_${uniqueId}.webm`);
    tempFiles.push(audioPath);

    // Write the uploaded file to disk
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(audioPath, buffer);
    console.log('✅ Audio file written to disk:', audioPath);

    try {
      // Initialize OpenAI
      console.log('🤖 Initializing OpenAI API...');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Send directly to Whisper API
      console.log('🎯 Sending to Whisper API...');
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });

      console.log('✅ Transcription successful:', transcription.text);
      return NextResponse.json({ transcription: transcription.text });
    } catch (error: any) {
      console.error('❌ Transcription error:', {
        message: error.message,
        stack: error.stack,
        details: error
      });
      return NextResponse.json(
        { 
          error: 'Error during transcription', 
          details: error.message,
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