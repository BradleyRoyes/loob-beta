import nextConnect from 'next-connect';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Configure multer to store files temporarily
const upload = multer({ dest: 'uploads/' });

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry, something happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Path to the temporary file
  const tempFilePath = req.file.path;

  try {
    // Read the file into a Buffer
    const fileBuffer = fs.readFileSync(tempFilePath);

    // Configure the request to Whisper API
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/audio/transcriptions',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'audio/mpeg'
      },
      data: fileBuffer,
      params: {
        model: "whisper-large", // Specify the model if necessary
      },
    });

    // Send the transcription response back to the client
    res.status(200).json({ transcription: response.data });

  } catch (error) {
    console.error('Error sending audio to Whisper API:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  } finally {
    // Clean up: delete the temporary file
    fs.unlinkSync(tempFilePath);
  }
});

export const config = {
  api: {
    bodyParser: false, // Disables body parsing, letting multer handle multipart/form-data
  },
};

export default apiRoute;
