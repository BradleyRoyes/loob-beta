// Import necessary modules and dependencies
import { NextApiRequest, NextApiResponse } from 'next';
import Whisper from 'whisper-nodejs';

// Define your Whisper API key (replace with your actual key)
const WHISPER_API_KEY = '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';

// Create an API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST.' });
  }

  try {
    // Check if the request body contains audio data (assuming the audio is in base64 format)
    const { audioBase64, modelName } = req.body;

    if (!audioBase64 || !modelName) {
      return res.status(400).json({ error: 'Missing audio data or modelName in the request body.' });
    }

    // Initialize Whisper with your API key
    const whisper = new Whisper(WHISPER_API_KEY);

    // Transcribe the audio using Whisper
    const text = await whisper.transcribe(audioBase64, modelName);

    // Respond with the transcribed text in a JSON format
    res.status(200).json({ success: true, transcription: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error transcribing audio' });
  }
}
