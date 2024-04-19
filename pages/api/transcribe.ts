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

interface FormidableData {
  fields: formidable.Fields;
  files: formidable.Files;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to read the file stream
const readFileAsync = promisify(fs.readFile);

export default async function handler(req, res) {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Parse the form data
  const fData = await new Promise<FormidableData>((resolve, reject) => {
    const form = new formidable.IncomingForm({
      uploadDir: "./tmp",
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    }); 
  });

  // console.log(fData.files);
  const audiofile = fData.files.audio;
  const audioFilePath = audiofile.path;
  console.log(audioFilePath);

  try {

    // Since we are directly using the file path for streaming, no need to read the file into memory
    const fileStream = fs.createReadStream(audioFilePath);
    
    // Call OpenAI API for speech-to-text
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1", // Make sure to use the correct model name
    });
    
    // Delete the temporary audio file
    fs.unlinkSync(audioFilePath);

    // Sending the transcription text back to the client
    res.status(200).json({ transcription: response.text });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Error transcribing audio.' });
  }
}

