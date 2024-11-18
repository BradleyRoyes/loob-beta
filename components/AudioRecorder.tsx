import React, { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, startRecording }) => {
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

      detectSilence(audioContext, stream);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const detectSilence = (audioContext: AudioContext, stream: MediaStream) => {
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    scriptProcessor.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);

      const volume = array.reduce((a, b) => a + b, 0) / array.length;

      if (volume < 10) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("Silence detected, stopping recording.");
            stopAudioRecording();
            stream.getTracks().forEach((track) => track.stop());
            scriptProcessor.disconnect();
            analyser.disconnect();
          }, 2000);
        }
      } else if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  };

  const stopAudioRecording = async () => {
    if (!recording || !recorderRef.current) return;

    try {
      const recorder = recorderRef.current;

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

      console.log("Recording stopped, WAV blob created:", blob);

      setTimeout(() => {
        onRecordingComplete(blob);
        setProcessing(false);
        setStatusMessage("Click to Start Recording");
      }, 3000);
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "15px",
      }}
    >
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
            color: #ff0080;
            text-shadow: 0 0 8px #ff8e88, 0 0 12px #ff0080;
          }
        `}
      </style>

      {!processing && (
        <button
          className="recordButton"
          onClick={recording ? stopAudioRecording : startAudioRecording}
          style={buttonStyle}
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
              <rect x="5" y="5" width="14" height="14" fill="#ff8e88" rx="3" />
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
      )}

      <div className="cyber-text">{statusMessage}</div>
    </div>
  );
};

export default AudioRecorder;
