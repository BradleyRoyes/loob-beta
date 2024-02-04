// pages/api/chat/transcribe.ts

import type { NextApiRequest, NextApiResponse } from 'next';
const Whisper = require('whisper-nodejs');
const whisper = new Whisper(process.env.OPENAI_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST.' });
  }

  // Assuming the audio file comes as form data
  // You might need additional npm packages like 'formidable' to parse 'multipart/form-data' in Next.js
  const data = await new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });

  const audioFile = data.audio; // Adjust based on the form field for the audio file

  try {
    // Use the file path from the uploaded file
    const transcription = await whisper.transcribe(audioFile.path, 'whisper-1');
    res.status(200).json({ success: true, transcription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error transcribing audio' });
  }
}
