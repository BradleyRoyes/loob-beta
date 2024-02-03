// Assuming api/chat/transcribe.js is correctly set up as an API endpoint

import Whisper from 'whisper-nodejs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST.' });
  }

  const whisper = new Whisper('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'); // Replace 'YOUR_API_KEY' with your actual OpenAI API key
  const { filePath, modelName } = req.body; // Expecting filePath and modelName in the request body

  try {
    const text = await whisper.transcribe(filePath, modelName);
    res.status(200).json({ success: true, text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error transcribing audio' });
  }
}
