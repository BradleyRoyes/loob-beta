import React, { useState } from 'react';
import './YourStylesheet.css'; // Make sure to import your CSS file

const AudioRecorder = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [animate, setAnimate] = useState(false); // State to control animation

  const startRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];

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
    setAnimate(true); // Start animation
    setTimeout(() => setAnimate(false), 2000); // Stop animation after 2 seconds
  };

  const buttonStyle = {
    backgroundColor: 'transparent',
    border: '2px solid var(--text-primary-inverse)',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    transition: 'all 0.3s',
  };

  const MicIcon = () => (
    <svg viewBox="0 0 24 24" ... > ... </svg>
  );

  return (
    <div>
      <button
        className={`recordButton ${animate ? 'animateSwirl' : ''}`}
        onClick={recording ? stopRecording : startRecording}
        style={buttonStyle}
      >
        <MicIcon />
      </button>
    </div>
  );
};

export default AudioRecorder;
