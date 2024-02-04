// pages/api/whisper.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

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

    // TODO: If necessary, convert the audioBuffer to the required format here before sending to Whisper.
    
    // Since this example skips audio format conversion, it directly uses the buffer.
    // Please adjust the approach based on the actual requirements and capabilities of your environment.
    
    // Sending the audio file to OpenAI's Whisper API for transcription
    const response
