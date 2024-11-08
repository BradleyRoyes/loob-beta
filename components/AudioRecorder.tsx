import React, { useState, useEffect, useCallback } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, startRecording }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [timer, setTimer] = useState<number>(0);

  // Stop recording function wrapped in useCallback
  const stopAudioRecording = useCallback(() => {
    if (!recording || !mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
  }, [recording, mediaRecorder]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= 60) {
            stopAudioRecording(); // Stop recording after 1 minute
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [recording, stopAudioRecording]);

  const startAudioRecording = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      let audioChunks: Blob[] = [];

      newMediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        audioChunks = [];
      };

      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder);
      setRecording(true);
      startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
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
    animation: recording ? 'pulse 1s infinite' : 'none', // Added animation for recording indicator
  };

  // Keyframes for the pulse animation
  const pulseAnimation = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;

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
      {/* Inject pulse animation */}
      <style>{pulseAnimation}</style>
      <button
        className="recordButton"
        onClick={recording ? stopAudioRecording : startAudioRecording}
        onTouchStart={recording ? stopAudioRecording : startAudioRecording}
        style={buttonStyle}
      >
        <MicIcon />
      </button>
      {recording && (
        <div className="recordingIndicator">
          <p>Recording... {timer}s</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
