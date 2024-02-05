const { handleCors } = require("./utils");

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const { createReadStream } = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Apply the handleCors middleware before your route handling
app.use("/api/chat/transcribe", handleCors);

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
    fs.writeFileSync(audioPath, audioBuffer);

    // Initialize Whisper API endpoint and API key
    const whisperApiKey = process.env.OPENAI_API_KEY;
    const whisperApiEndpoint = "https://api.openai.com/v1/whisper/recognize";

    // Send the audio file to the Whisper API for transcription
    const response = await axios.post(
      whisperApiEndpoint,
      createReadStream(audioPath),
      {
        headers: {
          "Content-Type": "audio/wav",
          Authorization: `Bearer ${whisperApiKey}`,
        },
      },
    );

    // Get the transcribed text from the Whisper API response
    const transcribedText = response.data.transcriptions[0].text;

    // Delete the temporary audio file
    fs.unlinkSync(audioPath);

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
