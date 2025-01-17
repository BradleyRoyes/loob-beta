import OpenAI from 'openai';
import formidable from 'formidable-serverless';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

// Set ffmpeg path with a fallback to system-wide ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic || '/usr/bin/ffmpeg');

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to transcode audio to WAV
const transcodeToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

// Helper function to parse form data
const parseForm = (req): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      uploadDir: '/tmp',
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// Handle POST requests
export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { fields, files }: { fields: any; files: any } = await parseForm(req);
    const audioFile = files.audio;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file received.' },
        { status: 400 }
      );
    }

    const uniqueId = uuidv4();
    const inputPath = audioFile.filepath || audioFile.path; // Ensure compatibility with both file systems
    const outputPath = `/tmp/audio_${uniqueId}.wav`;

    try {
      // Transcode audio to WAV
      await transcodeToWav(inputPath, outputPath);

      // Read the WAV file as a stream
      const fileStream = fs.createReadStream(outputPath);

      // Send the file to Whisper API
      const response = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
      });

      // Clean up temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      return NextResponse.json({ transcription: response.text });
    } catch (error) {
      console.error('Error during transcription:', error);
      return NextResponse.json(
        {
          error: 'Error during transcription.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error parsing form data:', error);
    return NextResponse.json(
      { error: 'Error parsing form data.', details: error.message },
      { status: 500 }
    );
  }
}
