import React, { useState } from 'react';

function AudioRecorder() {
  const [recorder, setRecorder] = useState(null);
  const [audio, setAudio] = useState(null);

  // Start recording
  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];

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
    const formData = new FormData();
    formData.append('audio', audio);

    try {
      const response = await fetch('/api/chat/transcribe', {
        method: 'POST',
        body: formData, // Send the audio blob as form data
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recorder}>Start Recording</button>
      <button onClick={stopRecording} disabled={!recorder}>Stop Recording</button>
      <button onClick={sendAudio} disabled={!audio}>Send Audio</button>
    </div>
  );
}

export default AudioRecorder;
