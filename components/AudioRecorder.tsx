import React, { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";
import * as THREE from "three";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, startRecording }) => {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("Click to Start Recording");
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const torusRef = useRef<HTMLDivElement | null>(null);

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

      // Start the timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 60) {
            stopAudioRecording(); // Auto-stop after 1 minute
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      detectSilence(audioContext, stream);

      console.log("Recording started");
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
        // Silence detected
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("Silence detected, stopping recording.");
            stopAudioRecording();
            stream.getTracks().forEach((track) => track.stop());
            scriptProcessor.disconnect();
            analyser.disconnect();
          }, 2000); // 2 seconds of silence threshold
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

      // Stop recording and get audio data as WAV
      const { blob } = await recorder.stop();
      setRecording(false);
      setProcessing(true);
      setTimer(0);
      setStatusMessage("Processing...");

      // Cleanup resources
      recorderRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      console.log("Recording stopped, WAV blob created:", blob);

      // Simulate processing time
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recorderRef.current) recorderRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!processing || !torusRef.current) return;

    // Initialize Three.js for the torus animation
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(200, 200);
    torusRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.TorusGeometry(5, 1.5, 16, 100);
    const material = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color("#ff8c00"),
      emissiveIntensity: 0.5,
      color: new THREE.Color("#ff0080"),
    });
    const torus = new THREE.Mesh(geometry, material);
    scene.add(torus);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);

    camera.position.z = 15;

    const animate = () => {
      if (!processing) return; // Stop animation if no longer processing
      requestAnimationFrame(animate);
      torus.rotation.x += 0.01;
      torus.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      while (torusRef.current?.firstChild) {
        torusRef.current.removeChild(torusRef.current.firstChild);
      }
    };
  }, [processing]);

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    border: recording ? "4px solid #ff8e88" : "2px solid var(--text-primary-inverse)",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    transition: "all 0.3s",
    animation: recording ? "pulse 1s infinite" : "none",
  };

  const MicIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      stroke={recording ? "none" : "var(--text-primary-inverse)"}
      strokeWidth="2"
      fill={recording ? "#ff8e88" : "none"}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {recording ? (
        <rect x="5" y="5" width="14" height="14" fill="#d32f2f" rx="3" />
      ) : (
        <>
          <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V4a3 3 0 1 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>

      <button
        className="recordButton"
        onClick={recording ? stopAudioRecording : startAudioRecording}
        style={buttonStyle}
      >
        <MicIcon />
      </button>

      <div style={{ marginTop: "10px", fontSize: "16px", color: recording ? "#ff8e88" : "#ffffff" }}>
        {statusMessage}
      </div>

      {recording && (
        <p style={{ marginTop: "5px", fontSize: "14px", color: "#ffffff" }}>
          Timer: {timer}s
        </p>
      )}

      {processing && (
        <div
          ref={torusRef}
          style={{
            margin: "20px auto",
            width: "200px",
            height: "200px",
          }}
        />
      )}
    </div>
  );
};

export default AudioRecorder;
