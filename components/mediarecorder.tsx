import React, { useState } from 'react';

interface AudioRecorderProps {
  onTranscription: (transcription: any) => void;
}

function AudioRecorder({ onTranscription }: AudioRecorderProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);

  // Start recording
  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
    }
  };

  // Stop recording
  const stopRecording = () => {
    recorder?.stop();
    // Reset recorder state
    setRecorder(null);
  };

  // Send audio to API
  const sendAudio = async () => {
    if (audio) {
      const formData = new FormData();
      formData.append('audio', audio);

      try {
        const response = await fetch('app/api/chat/transcribe.tsx', {
          method: 'POST',
          body: formData, // Send the audio blob as form data
        });
        const data = await response.json();
        onTranscription(data); // Call the onTranscription function with the transcribed data
      } catch (error) {
        console.error('Error sending audio:', error);
      }
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recorder !== null}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={recorder === null}>
        Stop Recording
      </button>
      <button onClick={sendAudio} disabled={audio === null}>
        Send Audio
      </button>
    </div>
  );
}

export default AudioRecorder;
