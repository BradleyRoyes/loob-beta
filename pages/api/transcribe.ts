import OpenAI from 'openai';
import formidable from 'formidable-serverless';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { v4 as uuidv4 } from 'uuid';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export const config = {
  api: {
    bodyParser: false,
  },
};

const transcodeToWav = (inputPath, outputPath) => {
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

  const form = new formidable.IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing form data.' });
    }

    const audioFile = files.audio;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio data received' });
    }

    const uniqueId = uuidv4();
    const audioFilePath = audioFile.path;
    const wavFilePath = `/tmp/audio_${uniqueId}.wav`;

    try {
      await transcodeToWav(audioFilePath, wavFilePath);

      const fileStream = fs.createReadStream(wavFilePath);
      const response = await openai.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-1", // Make sure to use the correct model name
      });

      fs.unlinkSync(audioFilePath);
      fs.unlinkSync(wavFilePath);

      res.status(200).json({ transcription: response.text });
    } catch (error) {
      console.error('Error during transcription:', error);
      res.status(500).json({ error: 'Error during transcription.', details: error.message });
    }
  });
}
