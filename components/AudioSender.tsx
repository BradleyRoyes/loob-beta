import React, { useState, useCallback } from "react";
import axios from "axios";

interface AudioSenderProps {
  onTranscription: (transcription: string) => void;
}

const AudioSender: React.FC<AudioSenderProps> = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      })
      .catch((err) => console.error("Error accessing media devices:", err));
  }, []);

  const stopRecordingAndSend = useCallback(async () => {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Stop all tracks to release the media stream

    mediaRecorder.addEventListener("dataavailable", async (event) => {
      const formData = new FormData();
      formData.append("audioBlob", event.data);

      try {
        const response = await axios.post("/api/transcribe", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        onTranscription(response.data.transcription);
      } catch (error) {
        console.error("Error sending audio to the server:", error);
      } finally {
        setIsRecording(false);
      }
    });

    // Reset MediaRecorder for the next recording
    setMediaRecorder(null);
  }, [mediaRecorder, onTranscription]);

  return (
    <div>
      <button onClick={isRecording ? stopRecordingAndSend : startRecording}>
        {isRecording ? "Stop Recording and Send" : "Start Recording"}
      </button>
    </div>
  );
};

export default AudioSender;