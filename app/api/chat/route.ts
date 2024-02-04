import { NextApiRequest, NextApiResponse } from 'next';
import Whisper from 'whisper-nodejs'; // Import Whisper without 'require'

const whisper = new Whisper(process.env.OPENAI_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST.' });
  }

  try {
    // Read the raw audio data from the request body
    const chunks: Uint8Array[] = [];

    req.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk);
      console.log(`Received chunk of data: ${chunk.length} bytes`);
    });

    req.on('end', async () => {
      const audioData = Buffer.concat(chunks);
      console.log(`Received complete audio data: ${audioData.length} bytes`);

      try {
        // Use the raw audio data to transcribe
        const transcription = await whisper.transcribe(audioData, 'whisper-1');
        res.status(200).json({ success: true, transcription });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error transcribing audio' });
      }
    });

    req.on('error', (err) => {
      console.error(err);
      res.status(500).json({ success: false, error: 'Error receiving audio data' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error processing audio data' });
  }
}
