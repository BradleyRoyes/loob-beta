import React, { useState, useRef } from 'react';
import axios from 'axios';

const AudioRecorder = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];

      mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlobUrl) {
      console.error('No audio to send');
      return;
    }

    try {
<<<<<<< HEAD
      const response = await fetch('/api/chat/transcribe', {
        method: 'POST',
        body: audio,
        headers: {
          'Content-Type': 'audio/mpeg', // Use the appropriate content type for the audio format
        },
=======
      const audioBlob = await fetch(audioBlobUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await axios.post('/api/chat/whisper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
>>>>>>> 203a81e1ae1a1db963bd378e1bbce2ab7d45ae45
      });

      console.log('Audio sent successfully', response.data);
      if (onTranscription) onTranscription(response.data.transcription);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <button onClick={sendAudio} disabled={!audioBlobUrl}>
        Send Audio
      </button>
    </div>
  );
};

export default AudioRecorder;
