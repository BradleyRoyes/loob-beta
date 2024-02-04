// Assuming api/chat/transcribe.ts is correctly set up as an API endpoint

import { NextApiRequest, NextApiResponse } from 'next';
import Whisper from 'whisper-nodejs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST.' });
  }

  try {
    const { filePath, modelName } = req.body; // Expecting filePath and modelName in the request body
    const whisper = new Whisper('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'); // Replace 'YOUR_API_KEY' with your actual OpenAI API key
    const text = await whisper.transcribe(filePath, modelName);
    res.status(200).json({ success: true, text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error transcribing audio' });
  }
}
