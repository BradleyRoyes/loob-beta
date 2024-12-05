import React, { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void; // Called when recording finishes
  onStartRecording?: () => void; // Optional callback for when recording starts
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onStartRecording }) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Click to speak");
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const startAudioRecording = async () => {
    if (recording || processing) return;

    if (onStartRecording) onStartRecording();

    try {
      const audioContext = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new Recorder(audioContext);

      await recorder.init(stream);
      recorder.start();

      recorderRef.current = recorder;
      audioContextRef.current = audioContext;
      setRecording(true);
      setStatusMessage("Recording... Click again to stop");

      analyzeAudio(audioContext, stream);
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatusMessage(
        error.message.includes("Permission denied")
          ? "Microphone access denied"
          : "Error starting recording"
      );
    }
  };

  const analyzeAudio = (audioContext: AudioContext, stream: MediaStream) => {
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    const processAudio = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);

      const volume = array.reduce((a, b) => a + b, 0) / array.length;
      setAudioLevel(volume);

      if (recording) {
        requestAnimationFrame(processAudio);
      }
    };

    microphone.connect(analyser);
    processAudio();
  };

  const stopAudioRecording = async () => {
    if (!recording || !recorderRef.current) return;

    try {
      const { blob } = await recorderRef.current.stop();
      recorderRef.current = null;

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setRecording(false);
      setProcessing(true);
      setStatusMessage("Processing audio...");

      // Simulated processing delay
      setTimeout(() => {
        setProcessing(false);
        setStatusMessage("Click to speak");
        onRecordingComplete(blob);
      }, 4000);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setStatusMessage("Error processing recording.");
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleClick = () => {
    if (recording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <style>
        {`
          .microphone-icon {
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(255, 182, 193, 0.9), rgba(255, 218, 185, 0.6));
            border-radius: 50%;
            position: relative;
            box-shadow: 0 0 ${10 + audioLevel * 0.5}px rgba(255, 145, 135, 0.8);
            transform: scale(${1 + audioLevel / 300});
            transition: transform 0.1s ease, box-shadow 0.1s ease;
          }
          .status-message {
            font-size: 16px;
            color: #666;
          }
        `}
      </style>

      <button
        aria-label={recording ? "Stop recording" : "Start recording"}
        onClick={handleClick}
        disabled={processing}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <div className="microphone-icon" />
      </button>

      <div className="status-message">{statusMessage}</div>
    </div>
  );
};

export default AudioRecorder;
