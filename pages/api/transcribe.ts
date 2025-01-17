import OpenAI from 'openai';
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';

// Set the ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic || '/usr/bin/ffmpeg');

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to transcode audio to WAV
const transcodeToWav = async (inputPath: string, outputPath: string) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('end', () => resolve())
      .on('error', reject)
      .save(outputPath);
  });
};

// Helper function to parse form data
const parseForm = (req: any): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir: '/tmp',
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// Default API handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { fields, files }: any = await parseForm(req);
    const audioFile = files?.audio;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file received.' });
    }

    const uniqueId = uuidv4();
    const inputPath = audioFile.filepath || audioFile.path;
    const outputPath = `/tmp/audio_${uniqueId}.wav`;

    try {
      // Transcode audio to WAV
      await transcodeToWav(inputPath, outputPath);

      // Read the WAV file as a buffer
      const wavBuffer = await fs.readFile(outputPath);

      // Send the file to Whisper API
      const file = new File([wavBuffer], `audio_${uniqueId}.wav`, { type: 'audio/wav' });
      const response = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });

      // Clean up temporary files
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);

      return res.status(200).json({ transcription: response.text });
    } catch (error) {
      console.error('Error during transcription:', error);
      return res.status(500).json({
        error: 'Error during transcription.',
        details: error.message || 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Error parsing form data:', error);
    return res.status(500).json({
      error: 'Error parsing form data.',
      details: error.message || 'Unknown error',
    });
  }
}
