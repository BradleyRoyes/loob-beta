// Import React and useState hook
import React, { useState } from 'react';
// Import the CSS module for styling
import styles from './AudioRecorder.module.css';

const AudioRecorder = ({ onRecordingComplete }) => {
  // State for managing recording status
  const [recording, setRecording] = useState(false);
  // State for storing the MediaRecorder instance
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    if (recording) return; // Prevent starting a new recording if already recording
    try {
      // Request access to the user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream);
      let audioChunks: Blob[] = []; // Array to hold audio chunks

      // Event handler for when data is available
      newMediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      // Event handler for when recording is stopped
      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        onRecordingComplete(audioBlob); // Callback with the complete audio blob
        audioChunks = []; // Reset audioChunks for a new recording
      };

      // Start recording
      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder); // Update state with the new MediaRecorder instance
      setRecording(true); // Update recording status
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (!recording || !mediaRecorder) return; // Check if it's recording and a MediaRecorder instance exists
    mediaRecorder.stop(); // Stop recording
    setRecording(false); // Update recording status
  };

  return (
    <div>
      <button
        onClick={recording ? stopRecording : startRecording}
        className={styles.audioButton} // Apply the styled class
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default AudioRecorder;
