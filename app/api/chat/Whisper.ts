import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Initialize OpenAI API
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      // Assuming the audio file is sent as FormData with the key 'audio'
      const { files } = req;
      if (!files || !files.audio) {
        return res.status(400).json({ error: 'No audio file uploaded.' });
      }

      const audioFile = files.audio[0];

      // Upload the audio file to OpenAI (adjust as necessary based on actual OpenAI SDK usage)
      const uploadResponse = await openai.createUpload({
        file: audioFile.path,
        purpose: 'transcription',
      });

      // Use the upload for transcription
      const transcriptionResponse = await openai.createTranscription({
        model: 'whisper-large',
        uploadId: uploadResponse.data.id,
      });

      // Send the transcription result back to the client
      res.status(200).json(transcriptionResponse.data);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    // Handle non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
