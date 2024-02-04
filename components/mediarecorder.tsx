import React, { useState, useRef } from 'react';
import axios from 'axios';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const startRecording = async () => {
    if (recording) return; // Prevent multiple recordings

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      let audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        setAudioFile(audioFile);
        console.log(`Recording stopped, file created: ${audioUrl}`);
      };

      mediaRecorder.start();
      setRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (!recording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setRecording(false);
    console.log('Recording stopped');
  };

  const sendAudio = async () => {
    if (!audioFile) {
      console.error('No audio file to send');
      return;
    }

    const formData = new FormData();
    formData.append('file', audioFile);

    try {
      const response = await axios.post('/api/chat/Whisper', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Audio sent successfully', response.data);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!recording}>
        Stop Recording
      </button>
      <button onClick={sendAudio} disabled={!audioFile}>
        Send Audio
      </button>
    </div>
  );
};

export default AudioRecorder;
