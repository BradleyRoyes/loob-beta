import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const whisperAPIEndpoint = 'https://api.openai.com/v1/audio/transcriptions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { audio: audioFile } = req.body;

  try {
    const transcription = await transcribeAudio(audioFile);
    res.status(200).json({ transcription });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}

async function transcribeAudio(audioFile: any) {
  const formData = new FormData();
  formData.append('file', audioFile);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  };

  try {
    const response = await axios.post(whisperAPIEndpoint, formData, config);
    return response.data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}
