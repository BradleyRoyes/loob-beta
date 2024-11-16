import React, { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";
import * as THREE from "three";

const AudioRecorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Click to Start Recording");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const torusRef = useRef<HTMLDivElement | null>(null);

  const startAudioRecording = async () => {
    if (recording || processing) return;

    setErrorMessage(null);

    try {
      const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new Recorder(audioContext);

      await recorder.init(stream);
      recorder.start();

      recorderRef.current = recorder;
      audioContextRef.current = audioContext;
      setRecording(true);
      setStatusMessage("Recording... Click again to stop");

      detectSilence(audioContext, stream);
    } catch (error) {
      console.error("Error starting recording:", error);
      setErrorMessage("Unable to start recording. Please check your microphone settings.");
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

      const { blob } = await recorder.stop();
      setRecording(false);
      setProcessing(true);
      setStatusMessage("Processing audio...");

      recorderRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Process transcription
      try {
        const transcription = await processTranscription(blob);
        console.log("Transcription:", transcription);
        setProcessing(false);
        setStatusMessage("Click to Start Recording");
      } catch (error) {
        console.error("Error processing transcription:", error);
        setProcessing(false);
        setErrorMessage("Error processing audio. Please try again.");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setProcessing(false);
      setErrorMessage("Error stopping recording. Please try again.");
    }
  };

  const processTranscription = async (audioBlob: Blob): Promise<string> => {
    console.log("Sending audio blob to Whisper API...");
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");

      const response = await fetch("/api/whisper", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.transcription;
    } catch (error) {
      console.error("Error with transcription API:", error);
      throw new Error("Failed to process transcription.");
    }
  };

  useEffect(() => {
    if (!processing || !torusRef.current) return;

    // Initialize Three.js for the torus animation
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(200, 200);
    torusRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(5, 1.5, 128, 16, 3, 2);
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.8,
      color: new THREE.Color("#FF4500"),
      emissive: new THREE.Color("#FFA500"),
      emissiveIntensity: 1,
    });
    const torus = new THREE.Mesh(geometry, material);
    scene.add(torus);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);

    camera.position.z = 20;

    const animate = () => {
      if (!processing) return;
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

  useEffect(() => {
    return () => {
      if (recorderRef.current) recorderRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    border: "2px solid #FFA500",
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
            stroke="#FFA500"
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
      )}

      <div className="cyber-text" style={{ marginTop: "15px" }}>
        {statusMessage}
      </div>

      {errorMessage && (
        <div style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
          {errorMessage}
        </div>
      )}

      {processing && (
        <div
          ref={torusRef}
          style={{
            margin: "20px auto",
            width: "150px",
            height: "150px",
          }}
        />
      )}
    </div>
  );
};

export default AudioRecorder;
