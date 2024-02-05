import React, { useState, useRef } from 'react';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const audioRef = useRef(null);

  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prevChunks) => [...prevChunks, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = audioUrl;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioChunks([]);
  };

  return (
    <div>
      <button onClick={handleToggleRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <audio ref={audioRef} controls />
    </div>
  );
}

