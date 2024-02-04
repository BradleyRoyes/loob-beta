// pages/api/whisper.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from "openai";

const openai = new OpenAI();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Initialize OpenAI configuration
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const { audio: base64Audio } = req.body;

    // Decode the Base64 audio string to binary format
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Sending the audio file to OpenAI's Whisper API for transcription
    const response = await openai.createTranscription({
      audio: audioBuffer,
      model: 'whisper-1',
    });

    // Extract the transcribed text from the API response
    const transcribedText = response.data.choices[0].text;

    // Respond with the transcribed text
    res.status(200).json({ text: transcribedText });
  } catch (error) {
    console.error('Whisper API error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}
