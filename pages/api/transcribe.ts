// pages/api/transcribe.js
import OpenAI from 'openai';
import formidable from 'formidable-serverless';
import fs from 'fs';
import { promisify } from 'util';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to read the file stream
const readFileAsync = promisify(fs.readFile);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Parse the form data
    const form = new formidable.IncomingForm();
    form.uploadDir = "./";
    form.keepExtensions = true;
    const parseForm = promisify(form.parse.bind(form));
    const { fields, files } = await parseForm(req);

    try {
      const audioFilePath = files.audio.filepath;

      // Since we are directly using the file path for streaming, no need to read the file into memory
      const fileStream = fs.createReadStream(audioFilePath);
      
      // Call OpenAI API for speech-to-text
      const response = await openai.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-large", // Make sure to use the correct model name
      });
      
      // Delete the temporary audio file
      fs.unlinkSync(audioFilePath);

      // Sending the transcription text back to the client
      res.status(200).json({ transcription: response.text });
  
    } catch (error) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ error: 'Error transcribing audio.' });
    }
  } else {
    // Handle non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
