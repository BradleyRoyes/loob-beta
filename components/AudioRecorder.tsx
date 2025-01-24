import React, { useState, useRef, useEffect } from "react";
import styles from "./AudioRecorder.module.css";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
  stopRecording: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  startRecording,
  stopRecording,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.log('MediaRecorder was already stopped');
      }
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  const analyzeAudio = (audioContext: AudioContext, stream: MediaStream) => {
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.3; // Reduced for more responsive animation
    analyser.fftSize = 512; // Reduced for better performance

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    scriptProcessor.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const volume = array.reduce((a, b) => a + b, 0) / array.length;
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => setAudioLevel(volume));
    };

    analyserRef.current = analyser;
    return () => {
      scriptProcessor.disconnect();
      analyser.disconnect();
      microphone.disconnect();
    };
  };

  const handleStartRecording = async () => {
    try {
      if (isRecording) {
        handleStopRecording();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const cleanup = analyzeAudio(audioContext, stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        cleanup();
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        cleanupRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      startRecording();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      cleanupRecording();
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    stopRecording();
    cleanupRecording();
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  return (
    <div className={styles.container}>
      <button
        onClick={handleStartRecording}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (isRecording) {
            handleStopRecording();
          }
        }}
        className={styles.recorderButton}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <div className={styles.microphoneIcon}>
          {isRecording ? <StopIcon /> : <MicIcon />}
          <div className={styles.rippleContainer}>
            {isRecording && Array.from({ length: Math.min(5, Math.ceil(audioLevel / 25)) }).map((_, i) => (
              <div
                key={i}
                className={styles.ripple}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.5s',
                  opacity: Math.max(0.2, Math.min(audioLevel / 100, 0.8))
                }}
              />
            ))}
          </div>
          {isRecording && (
            <div 
              className={styles.glowRipple}
              style={{
                width: `${80 + audioLevel}px`,
                height: `${80 + audioLevel}px`,
                opacity: Math.min(audioLevel / 100, 0.6)
              }}
            />
          )}
        </div>
      </button>
    </div>
  );
};

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z" />
  </svg>
);

export default AudioRecorder;
