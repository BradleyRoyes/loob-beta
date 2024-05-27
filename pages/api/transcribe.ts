import OpenAI from 'openai';
import formidable from 'formidable-serverless';
import fs from 'fs';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to decode Base64 audio and save to a file
const decodeBase64Audio = (base64Data: string, filePath: string) => {
  return new Promise((resolve, reject) => {
    const base64String = base64Data.split(',')[1];
    if (!base64String) {
      return reject(new Error('Invalid Base64 string'));
    }
    const buffer = Buffer.from(base64String, 'base64');
    fs.writeFile(filePath, buffer, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
};

// Helper function to transcode audio file to WAV
const transcodeToWav = (inputPath: string, outputPath: string) => {
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

  try {
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

    console.log('Form data received:', fData.fields);

    const audioBase64 = fData.fields.audio as string;

    if (!audioBase64) {
      throw new Error('No audio data received');
    }

    const uniqueId = uuidv4();
    const audioFilePath = `/tmp/audio_${uniqueId}.webm`;
    const wavFilePath = `/tmp/audio_${uniqueId}.wav`;
    console.log('Audio file path:', audioFilePath);

    // Decode the Base64 audio and save as a file
    await decodeBase64Audio(audioBase64, audioFilePath);

    // Transcode the audio file to WAV
    await transcodeToWav(audioFilePath, wavFilePath);

    // Since we are directly using the file path for streaming, no need to read the file into memory
    const fileStream = fs.createReadStream(wavFilePath);
    
    // Call OpenAI API for speech-to-text
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1", // Make sure to use the correct model name
    });
    
    // Delete the temporary audio files
    fs.unlinkSync(audioFilePath);
    fs.unlinkSync(wavFilePath);

    // Sending the transcription text back to the client
    res.status(200).json({ transcription: response.text });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Error transcribing audio.', details: error.message });
  }
}
