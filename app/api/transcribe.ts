// pages/api/transcribe-audio.ts

import nextConnect from 'next-connect';
import formidable from 'formidable';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = nextConnect()
  .post(async (req: NextApiRequest, res: NextApiResponse) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = "./uploads";
    form.keepExtensions = true;
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'There was an error parsing the files' });
        return;
      }

      const audioFile = files.audio as formidable.File;

      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFile.filepath), {
        filename: audioFile.originalFilename,
      });

      try {
        const response = await fetch('https://api.openai.com/v1/audio', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Whisper API error: ${response.statusText}`);
        }

        const data = await response.json();
        fs.unlinkSync(audioFile.filepath); // Cleanup the uploaded file
        res.json(data);
      } catch (error) {
        console.error('Error transcribing audio with Whisper:', error);
        res.status(500).json({ message: 'Failed to transcribe audio', error: error.message });
      }
    });
  });

export const config = {
  api: {
    bodyParser: false, // Disable the default bodyParser to use formidable
  },
};

export default handler;
