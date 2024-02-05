import React, { useState } from "react";
import axios from "axios";
import fs from "fs";

export default function AudioSender({ audioBlob, onTranscription }) {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = () => {
    // Implement code to start recording audio (not shown in this example)
    setIsRecording(true);
  };

  const stopRecordingAndSend = async () => {
    // Implement code to stop recording audio (not shown in this example)

    try {
      const formData = new FormData();
      formData.append("audioBlob", audioBlob);

      // Save the uploaded audio file temporarily
      const audioBuffer = audioBlob.buffer;
      const audioPath = "temp_audio.wav";
      await fs.writeFile(audioPath, audioBuffer);

      // Send the audio data to the server
      const whisperApiKey = process.env.OPENAI_API_KEY;
      const whisperApiEndpoint =
        "https://api.openai.com/v1/audio/transcriptions";
      // Send the audio file to the Whisper API for transcription
      const response = await axios.post(
        whisperApiEndpoint,
        fs.createReadStream(audioPath),
        {
          headers: {
            "Content-Type": "audio/wav",
            Authorization: `Bearer ${whisperApiKey}`,
          },
        },
      );
      // Handle the server's response, e.g., update the UI with the transcribed text
      onTranscription(response.data.transcribedText);
    } catch (error) {
      console.error("Error sending audio to the server:", error);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecordingAndSend : startRecording}>
        {isRecording ? "Stop Recording and Send" : "Start Recording"}
      </button>
    </div>
  );
}
