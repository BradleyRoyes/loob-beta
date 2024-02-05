// pages/api/transcribe.js
import { OpenAI } from "openai";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const openai = new OpenAI(process.env.OPENAI_API_KEY);

      // Assuming you're sending audio data as base64 in the body
      const { audioBase64 } = req.body;
      const buffer = Buffer.from(audioBase64, 'base64');

      const response = await openai.audio.transcriptions.create({
        model: "whisper-1", // Use the appropriate model version
        file: buffer,
      });

      res.status(200).json({ transcription: response.data.text });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio." });
    }
  } else {
    // Handle any non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};