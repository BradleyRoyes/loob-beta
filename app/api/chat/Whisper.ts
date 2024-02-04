import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { audio: base64Audio } = req.body;

    // Decode the Base64 audio string to binary format
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // TODO: If necessary, convert the audioBuffer to the required format here before sending to Whisper.
    
    // Since this example skips audio format conversion, it directly uses the buffer.
    // Please adjust the approach based on the actual requirements and capabilities of your environment.
    
    // Sending the audio file to OpenAI's Whisper API for transcription
    const openai = new OpenAI();
    const response = await openai.createTranscription({
      audio: audioBuffer,
      model: 'whisper-1',
    });

    // Handle the response as needed
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}
