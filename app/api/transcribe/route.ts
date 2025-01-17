import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
import { NextResponse } from 'next/server';

const ffmpeg = createFFmpeg({ log: true });

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to transcode audio to WAV
const transcodeToWav = async (inputPath: string, outputPath: string) => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  const inputFile = await fetchFile(inputPath);

  ffmpeg.FS('writeFile', 'input', inputFile);
  await ffmpeg.run('-i', 'input', 'output.wav');
  const output = ffmpeg.FS('readFile', 'output.wav');
  await fs.writeFile(outputPath, Buffer.from(output));
};

// Helper function to parse form data
const parseForm = (req: any) =>
  new Promise((resolve, reject) => {
    const form = formidable({ uploadDir: '/tmp', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

// Handle POST requests
export async function POST(req: any) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { files } = await parseForm(req);
    const audioFile = files.audio;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file received.' },
        { status: 400 }
      );
    }

    const uniqueId = uuidv4();
    const inputPath = audioFile.filepath;
    const outputPath = `/tmp/audio_${uniqueId}.wav`;

    try {
      // Transcode audio to WAV
      await transcodeToWav(inputPath, outputPath);

      // Read the WAV file as a stream
      const fileStream = await fs.readFile(outputPath);

      // Send the file to Whisper API
      const response = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
      });

      // Clean up temporary files
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);

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
