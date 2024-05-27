// pages/api/transcribe.js
import OpenAI from 'openai';
import formidable from 'formidable-serverless';
import fs from 'fs';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormidableData {
  fields: formidable.Fields;
  files: formidable.Files;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to read the file stream
const readFileAsync = promisify(fs.readFile);

// Helper function to transcode audio file to MP3
const transcodeToMp3 = (inputPath: string, outputPath: string) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

export default async function handler(req, res) {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Parse the form data
  const fData = await new Promise<FormidableData>((resolve, reject) => {
    const form = new formidable.IncomingForm({
      uploadDir: "/tmp",
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    }); 
  });

  // console.log(fData.files);
  const audiofile = fData.files.audio;
  const audioFilePath = audiofile.path;
  const mp3FilePath = `${audioFilePath}.mp3`;
  console.log(audioFilePath);

  try {

    // Transcode the audio file to MP3
    await transcodeToMp3(audioFilePath, mp3FilePath);

    // Since we are directly using the file path for streaming, no need to read the file into memory
    const fileStream = fs.createReadStream(mp3FilePath);
    
    // Call OpenAI API for speech-to-text
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1", // Make sure to use the correct model name
    });
    
    // Delete the temporary audio file
    fs.unlinkSync(audioFilePath);
    fs.unlinkSync(mp3FilePath);

    // Sending the transcription text back to the client
    res.status(200).json({ transcription: response.text });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Error transcribing audio.' });
  }
}

