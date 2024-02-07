// pages/api/transcribe.ts

import { NextApiRequest, NextApiResponse } from 'next';
import openai from 'openai'; // Assuming you've configured this with your API key

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openaiClient = new openai.OpenAI(openaiApiKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Extract audio data from request body
    const { audioData } = req.body;

    try {
      // Make a call to the Whisper API to transcribe the audio
      const transcription = await openaiClient.whisper.transcribe(audioData);

      // Return the transcription
      res.status(200).json({ transcription });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ error: 'Error transcribing audio' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
