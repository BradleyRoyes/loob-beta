import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();

  const cleanupRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
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

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }

    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const analyzeAudio = useCallback((audioContext: AudioContext, stream: MediaStream) => {
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);

    analyser.smoothingTimeConstant = 0.3; // Keep smooth response
    analyser.fftSize = 256; // Reduced for better performance while maintaining quality

    microphone.connect(analyser);

    const updateAudioLevel = () => {
      if (!isRecording) return;
      
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      
      // Optimized volume calculation
      let sum = 0;
      const length = array.length;
      for (let i = 0; i < length; i++) {
        sum += array[i];
      }
      const volume = sum / length;
      
      // Use requestAnimationFrame for smoother updates
      animationFrameRef.current = requestAnimationFrame(() => {
        setAudioLevel(Math.min(volume * 1.2, 100)); // Enhanced sensitivity
      });
    };

    updateAudioLevel();
    analyserRef.current = analyser;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      analyser.disconnect();
      microphone.disconnect();
    };
  }, [isRecording]);

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
          channelCount: 1, // Mono for better performance
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const cleanup = analyzeAudio(audioContextRef.current, stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // Optimize for web
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

  const handleStopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;
    stopRecording();
    cleanupRecording();
  }, [isRecording, stopRecording, cleanupRecording]);

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, [cleanupRecording]);

  return (
    <div className={styles.container}>
      <button
        onClick={handleStartRecording}
        onTouchStart={(e) => {
          e.preventDefault();
          handleStartRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (isRecording) {
            handleStopRecording();
          }
        }}
        className={styles.recorderButton}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <div className={`${styles.microphoneIcon} ${isRecording ? styles.recording : ''}`}>
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

const MicIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

const StopIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z" />
  </svg>
);

export default AudioRecorder;
