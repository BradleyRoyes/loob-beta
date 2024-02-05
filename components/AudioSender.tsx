import React, { useState } from "react";
import axios from "axios";

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

      // Send the audio data to the server
      const response = await axios.post("../app/api/chat/transcribe", formData);

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
