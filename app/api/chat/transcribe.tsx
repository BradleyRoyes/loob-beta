import type { NextApiRequest, NextApiResponse } from 'next';
import Whisper from 'whisper-nodejs'; // Import Whisper without 'require'
const whisper = new Whisper(process.env.OPENAI_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST.' });
  }

  try {
    // Read the raw audio data from the request body
    const audioBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      req.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        const audioData = Buffer.concat(chunks);
        resolve(audioData);
      });

      req.on('error', (err) => {
        reject(err);
      });
    });

    // Check if audioBuffer is null or empty
    if (!audioBuffer || audioBuffer.length === 0) {
      console.log('No audio data received.'); // Add this console log
      return res.status(400).json({ success: false, error: 'No audio data received.' });
    }
    else {
      console.log('Audio data received.'); // Add this console log
      return res.status(200).json({ success: true, data: "audioBuffer" });
      
    }
      

    // Use the raw audio data to transcribe
    const transcription = await whisper.transcribe(audioBuffer, 'whisper-1');
    res.status(200).json({ success: true, transcription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error transcribing audio' });
  }
}

