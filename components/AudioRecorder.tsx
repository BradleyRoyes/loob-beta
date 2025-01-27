import React, { useState, useRef, useEffect } from "react";
import styles from "./AudioRecorder.module.css";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
  stopRecording: () => void;
  className?: string;
}

/**
 * AudioRecorder Component
 * A mobile-friendly audio recording component with visual feedback
 * and comprehensive error handling for various device scenarios.
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  startRecording,
  stopRecording,
}) => {
  // State management for recording status and audio visualization
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to maintain references across re-renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Safely cleans up all audio resources and resets state
   * Called during component unmount and after recording stops
   */
  const cleanupRecording = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping track:', e);
          }
        });
        streamRef.current = null;
      }

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // This error is expected if already stopped
          console.debug('MediaRecorder was already stopped');
        }
        mediaRecorderRef.current = null;
      }

      setIsRecording(false);
      setAudioLevel(0);
      setError(null);
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  };

  /**
   * Sets up audio analysis for visualization
   * Includes automatic cleanup of audio context resources
   */
  const analyzeAudio = (audioContext: AudioContext, stream: MediaStream) => {
    try {
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

      // Optimized settings for mobile performance
      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 512;

      microphone.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      scriptProcessor.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const volume = array.reduce((a, b) => a + b, 0) / array.length;
        requestAnimationFrame(() => setAudioLevel(volume));
      };

      analyserRef.current = analyser;

      return () => {
        try {
          scriptProcessor.disconnect();
          analyser.disconnect();
          microphone.disconnect();
        } catch (e) {
          console.warn('Error disconnecting audio nodes:', e);
        }
      };
    } catch (e) {
      console.error('Error setting up audio analysis:', e);
      throw e;
    }
  };

  /**
   * Initiates audio recording with error handling for various scenarios
   * Handles mobile-specific permission requests and browser compatibility
   */
  const handleStartRecording = async () => {
    try {
      setError(null);

      if (isRecording) {
        handleStopRecording();
        return;
      }

      // Check for browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser');
      }

      // Optimized audio constraints for mobile devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific constraints
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      
      streamRef.current = stream;

      // Handle different browser implementations of AudioContext
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('AudioContext is not supported in this browser');
      }

      const audioContext = new AudioContext();
      const cleanup = analyzeAudio(audioContext, stream);

      // Check for MediaRecorder support and preferred codec
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        throw new Error('Preferred audio codec not supported. Recording quality may be affected.');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('An error occurred during recording');
        cleanupRecording();
      };

      mediaRecorder.onstop = () => {
        cleanup();
        if (chunksRef.current.length === 0) {
          setError('No audio data was captured');
          return;
        }
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        cleanupRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      startRecording();

    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      console.error("Recording error:", error);
      cleanupRecording();
    }
  };

  /**
   * Safely stops recording and handles any errors during the process
   */
  const handleStopRecording = () => {
    try {
      if (!mediaRecorderRef.current || !isRecording) return;
      
      stopRecording();
      cleanupRecording();
    } catch (error) {
      console.error("Error stopping recording:", error);
      setError('Failed to stop recording properly');
      cleanupRecording();
    }
  };

  /**
   * Helper function to provide user-friendly error messages
   */
  const getErrorMessage = (error: any): string => {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Microphone permission was denied. Please allow microphone access to record audio.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No microphone was found on your device.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Your microphone is busy or not accessible.';
    } else if (error.name === 'SecurityError') {
      return 'Recording audio is not allowed in this context. Please ensure you\'re using HTTPS.';
    }
    return error.message || 'An unexpected error occurred while accessing the microphone.';
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
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
        disabled={!!error}
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
