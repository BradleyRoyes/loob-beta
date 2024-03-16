import React, { useState } from 'react';

const AudioRecorder = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm",
      "audio/webm; codecs=opus",
      "audio/ogg; codecs=opus",
      "audio/wav",
    ];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || null;
  };

  const startRecording = async () => {
    if (recording || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Recording in progress or MediaDevices API not supported.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        console.error("No supported audio MIME type found.");
        return;
      }
      const options = mimeType ? { mimeType } : {};
      const newMediaRecorder = new MediaRecorder(stream, options);

      let audioChunks = [];
      newMediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        onRecordingComplete(audioBlob);
        audioChunks = [];
      };

      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder);
      setRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (!recording || !mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
  };

  const buttonStyle = {
    backgroundColor: recording ? '#ff8e88' : 'transparent', // Color changes when recording
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
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke={recording ? '#ff8e88' : "var(--text-primary-inverse)"}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );

  return (
    <div>
      <button
        onClick={recording ? stopRecording : startRecording}
        style={buttonStyle}
      >
        <MicIcon />
      </button>
    </div>
  );
};

export default AudioRecorder;
