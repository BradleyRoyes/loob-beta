import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs/promises";
import { createReadStream, unlink } from "fs/promises";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define an API endpoint for audio file transcription
app.post("/api/chat/transcribe", upload.single("audio"), async (req, res) => {
  try {
    // Check if the request contains an audio file
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is missing" });
    }

    // Save the uploaded audio file temporarily
    const audioBuffer = req.file.buffer;
    const audioPath = "temp_audio.wav";
    await fs.writeFile(audioPath, audioBuffer);

    // Initialize the API endpoint and API key
    const apiKey = process.env.OPENAI_API_KEY;
    const apiEndpoint = "https://api.openai.com/v1/audio/transcriptions";

    // Define the request payload
    const requestData = {
      model: "whisper-1",
      language: "en",
      file: createReadStream(audioPath),
    };

    // Send the audio file to the OpenAI API for transcription
    const response = await axios.post(apiEndpoint, requestData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // Get the transcribed text from the API response
    const transcribedText = response.data.transcription;

    // Delete the temporary audio file
    await unlink(audioPath);

    // Return the transcribed text as a JSON response
    return res.status(200).json({ transcribedText });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});