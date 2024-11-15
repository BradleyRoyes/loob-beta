import React, { useState, useRef } from 'react';
import Recorder from 'recorder-js';

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, startRecording }) => {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAudioRecording = async () => {
    if (recording) return;

    try {
      // Initialize AudioContext with TypeScript-compatible check
      const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new Recorder(audioContext);

      await recorder.init(stream);
      recorder.start();

      recorderRef.current = recorder;
      audioContextRef.current = audioContext;
      setRecording(true);
      startRecording();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 60) {
            stopAudioRecording(); // Stop recording after 1 minute
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      console.log("Recording started");

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopAudioRecording = async () => {
    if (!recording || !recorderRef.current) return;

    try {
      const recorder = recorderRef.current;

      // Stop recording and get audio data as WAV
      const { blob } = await recorder.stop();
      setRecording(false);
      setTimer(0);

      // Clean up
      recorderRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      console.log("Recording stopped, WAV blob created:", blob);
      onRecordingComplete(blob);

    } catch (error) {
      console.error("Error stopping recording:", error);
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
    animation: recording ? 'pulse 1s infinite' : 'none',
  };

  // Keyframes for pulse animation
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
