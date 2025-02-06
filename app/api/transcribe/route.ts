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
    'audio/aac': 'aac'
  };
  return mimeToExt[mimeType] || 'webm';
}

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

    // Log detailed file information
    console.log('📦 Received audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified,
      userAgent: request.headers.get('user-agent')
    });

    // Validate file size
    if (audioFile.size === 0) {
      console.error('❌ Empty audio file received');
      return NextResponse.json(
        { error: 'Audio file is empty.' },
        { status: 400 }
      );
    }

    // Get appropriate file extension based on MIME type
    const fileExt = getFileExtension(audioFile.type);
    const uniqueId = uuidv4();
    const audioPath = join(tmpdir(), `audio_${uniqueId}.${fileExt}`);
    tempFiles.push(audioPath);

    // Write the uploaded file to disk
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('📝 Writing audio file:', {
      path: audioPath,
      size: buffer.length,
      extension: fileExt
    });

    await writeFile(audioPath, buffer);
    console.log('✅ Audio file written to disk:', audioPath);

    try {
      // Initialize OpenAI
      console.log('🤖 Initializing OpenAI API...');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Send directly to Whisper API
      console.log('🎯 Sending to Whisper API...', {
        fileSize: audioFile.size,
        mimeType: audioFile.type
      });

      // Try to transcribe directly from the File object first
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });

        console.log('✅ Transcription successful:', transcription.text);
        return NextResponse.json({ transcription: transcription.text });
      } catch (directError: any) {
        console.warn('⚠️ Direct transcription failed, trying with file from disk:', directError.message);
        
        // If direct transcription fails, try with the file from disk
        const fileHandle = await import('node:fs').then(fs => 
          fs.createReadStream(audioPath)
        );

        const transcription = await openai.audio.transcriptions.create({
          file: fileHandle as any,
          model: 'whisper-1',
        });

        console.log('✅ Fallback transcription successful:', transcription.text);
        return NextResponse.json({ transcription: transcription.text });
      }
    } catch (error: any) {
      console.error('❌ Transcription error:', {
        message: error.message,
        stack: error.stack,
        details: error,
        fileInfo: {
          size: audioFile.size,
          type: audioFile.type,
          name: audioFile.name
        }
      });
      return NextResponse.json(
        { 
          error: 'Error during transcription', 
          details: error.message,
          fileInfo: {
            size: audioFile.size,
            type: audioFile.type
          },
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