  import express from 'express';
  import multer from 'multer';
  import fetch from 'node-fetch';
  import FormData from 'form-data';
  import fs from 'fs';
  import path from 'path';

  const app = express();
  const port = process.env.PORT || 3000;
  const upload = multer({ dest: 'uploads/' });

  app.post('/transcribe-audio', upload.single('audio'), async (req, res) => {
      if (!req.file) {
          return res.status(400).send('No audio file uploaded.');
      }

      const audioFilePath = req.file.path;
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath), {
          filename: path.basename(audioFilePath),
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
          fs.unlinkSync(audioFilePath); // Cleanup the uploaded file
          res.json(data);
      } catch (error) {
          console.error('Error transcribing audio with Whisper:', error);
          res.status(500).json({ message: 'Failed to transcribe audio', error: error.message });
      }
  });

  app.listen(port, () => {
      console.log(`Server running on port ${port}`);
  });
