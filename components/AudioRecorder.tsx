import React, { useState } from 'react';

const AudioRecorder = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream);
      // Explicitly type audioChunks as an array of Blob objects
      let audioChunks: Blob[] = [];

      newMediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
        audioChunks = [];
      };

      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder);
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (!recording || !mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default AudioRecorder;
