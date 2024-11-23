import React, { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, startRecording }) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Click me and speak");
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

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
      setStatusMessage("Recording... Click me again to stop");

      startRecording();
      analyzeAudio(audioContext, stream);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const analyzeAudio = (audioContext: AudioContext, stream: MediaStream) => {
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
      setAudioLevel(volume);
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
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setTimeout(() => {
        setStatusMessage("Still processing...");
        setTimeout(() => {
          setStatusMessage("Click me and speak");
          setProcessing(false);
          onRecordingComplete(blob);
        }, 6000); // Additional delay for the "still processing" phase
      }, 2000); // Initial delay before showing "still processing"
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

  const handleClick = () => {
    if (recording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  const buttonStyle: React.CSSProperties = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    margin: 0,
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
          /* Main Button Style */
          .microphone-icon {
            width: 100px;
            height: 100px;
            background: radial-gradient(circle at center, rgba(255, 182, 193, 0.9), rgba(255, 218, 185, 0.6));
            border-radius: 50%;
            position: relative;
            box-shadow: 0 0 ${10 + audioLevel * 0.5}px rgba(255, 145, 135, 0.8);
            transform: scale(${1 + audioLevel / 300});
            transition: transform 0.1s ease, box-shadow 0.1s ease;
          }

          /* Outer Ripple Effect */
          .ripple-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400%;
            height: 400%;
            pointer-events: none;
          }

          .ripple {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(255, 180, 120, 0.5), transparent);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(1);
            animation: rippleEffect 2.5s ease-out infinite;
          }

          @keyframes rippleEffect {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(10);
            }
          }

          /* Glow Ripple for Button */
          .glow-ripple {
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${150 + audioLevel * 1.5}px;
            height: ${150 + audioLevel * 1.5}px;
            background: radial-gradient(circle, rgba(255, 145, 135, 0.4), transparent);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: glowEffect 1.5s ease-out infinite;
            opacity: ${Math.min(audioLevel / 50, 1)};
          }

          @keyframes glowEffect {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
            }
          }

          .cyber-text {
            font-size: 18px;
            font-family: 'Courier New', Courier, monospace;
            color: darkorange;
            text-shadow: 0 0 10px #ff8e88, 0 0 15px darkorange;
          }
        `}
      </style>

      <button
        className="recordButton"
        onClick={handleClick}
        style={buttonStyle}
        disabled={processing}
      >
        <div className="microphone-icon">
          <div className="ripple-container">
            {Array.from({ length: Math.min(8, Math.ceil(audioLevel / 20)) }).map((_, i) => (
              <div
                key={i}
                className="ripple"
                style={{
                  animationDelay: `${i * (0.2 / Math.max(audioLevel / 50, 1))}s`,
                  animationDuration: `${2.5 - Math.min(audioLevel / 50, 1.5)}s`,
                }}
              ></div>
            ))}
          </div>
          <div className="glow-ripple"></div>
        </div>
      </button>

      <div className="cyber-text">{statusMessage}</div>
    </div>
  );
};

export default AudioRecorder;
