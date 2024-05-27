import React, { useState } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  startRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, startRecording }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startAudioRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      let audioChunks: Blob[] = [];

      newMediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        audioChunks = [];
      };

      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder);
      setRecording(true);
      startRecording(); // Trigger the start recording animation
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopAudioRecording = () => {
    if (!recording || !mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
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
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke={recording ? 'none' : "var(--text-primary-inverse)"}
      strokeWidth="2"
      fill={recording ? '#ff8e88' : "none"}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {recording ? (
        <rect x="5" y="5" width="14" height="14" fill="#d32f2f" rx="3" />
      ) : (
        <>
          <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );

  return (
    <div>
      <button className="recordButton"
        onClick={recording ? stopAudioRecording : startAudioRecording}
        style={buttonStyle}
      >
        <MicIcon />
      </button>
    </div>
  );
};

export default AudioRecorder;
