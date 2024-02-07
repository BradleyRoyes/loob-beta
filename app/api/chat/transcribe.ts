// pages/api/chat/transcribe.ts

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { file } = req.body;

    try {
      // Send the audio file to the Whisper API for transcription
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      const openaiApiKey = process.env.OPENAI_API_KEY; // Get OpenAI API key
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is missing.');
      }

      const response= await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`, // Include OpenAI API key in headers
          'Content-Type': 'multipart/form-data', // Specify content type
        },
      });

      // Return the transcribed text to the client
      res.status(200).json({ text: response.data.text });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ error: 'Error transcribing audio' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}