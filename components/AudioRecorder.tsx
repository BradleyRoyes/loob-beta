import React, { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcription: string) => void;
  startRecording: () => void;
  processTranscription: (audioBlob: Blob) => Promise<string>; // Function for Whisper API
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  startRecording,
  processTranscription,
}) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Click to Start Recording");
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startAudioRecording = async () => {
    if (recording || processing) return;

    try {
      const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new Recorder(audioContext);

      await recorder.init(stream);
      recorder.start();

      recorderRef.current = recorder;
      audioContextRef.current = audioContext;
      setRecording(true);
      setStatusMessage("Recording... Click again to end");

      startRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopAudioRecording = async () => {
    if (!recording || !recorderRef.current) return;

    try {
      const recorder = recorderRef.current;

      // Stop recording and get audio data as WAV
      const { blob } = await recorder.stop();
      setRecording(false);
      setProcessing(true);
      setStatusMessage("Processing...");

      recorderRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Process transcription with Whisper API
      try {
        const transcription = await processTranscription(blob); // Wait for transcription to complete
        setProcessing(false);
        setStatusMessage("Click to Start Recording");
        onRecordingComplete(blob, transcription); // Send audio and transcription back
      } catch (apiError) {
        console.error("Error processing transcription:", apiError);
        setProcessing(false);
        setStatusMessage("Error processing. Try again.");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current) recorderRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "2px solid var(--text-primary-inverse)",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    width: "80px",
    height: "80px",
    transition: "all 0.3s",
    animation: recording ? "pulse 1s infinite" : "none",
  };

  return (
    <div style={{ textAlign: "center" }}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }

          .cyber-text {
            font-size: 16px;
            font-family: 'Courier New', Courier, monospace;
            color: #FFA500;
            text-shadow: 0 0 8px #FFA500, 0 0 12px #FF4500;
          }

          .spinner {
            margin-top: 10px;
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 165, 0, 0.3);
            border-top: 3px solid #FFA500;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <button
        className="recordButton"
        onClick={recording ? stopAudioRecording : startAudioRecording}
        style={buttonStyle}
        disabled={processing}
      >
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          stroke="var(--text-primary-inverse)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {recording ? (
            <rect x="5" y="5" width="14" height="14" fill="#FFA500" rx="3" />
          ) : (
            <>
              <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V4a3 3 0 1 1 3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </svg>
      </button>

      <div className="cyber-text" style={{ marginTop: "15px" }}>
        {statusMessage}
        {processing && <div className="spinner" />}
      </div>
    </div>
  );
};

export default AudioRecorder;
