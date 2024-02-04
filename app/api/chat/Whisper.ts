// pages/api/transcribe.js

import { IncomingForm } from 'formidable';
import fs from 'fs';
import axios from 'axios';

export const config = {
    api: {
        bodyParser: false, // Disable Next.js' default body parser
    },
};

const transcribeAudio = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error(err);
            return res.status(500).end('Internal server error');
        }

        // Ensure there's a file
        if (!files.audio) {
            return res.status(400).end('No audio file uploaded');
        }

        const audioFile = files.audio.filepath;
        const audioBuffer = fs.readFileSync(audioFile);

        try {
            const formData = new FormData();
            formData.append('file', audioBuffer, files.audio.originalFilename);
            formData.append('model', 'whisper-1');

            const response = await axios({
                method: 'post',
                url: 'https://api.openai.com/v1/audio/transcriptions',
                data: formData,
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });

            return res.status(200).json(response.data);
        } catch (error) {
            console.error('Error calling Whisper API:', error);
            return res.status(500).json({ message: 'Error processing audio', error: error.message });
        }
    });
};

export default transcribeAudio;
