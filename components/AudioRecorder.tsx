import React, { useState, useRef, useEffect } from "react";
import styles from "./AudioRecorder.module.css";
import { checkPermission, requestMicrophonePermission, getPermissionInstructions } from '../utils/permissions';

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

  const [browserSupport, setBrowserSupport] = useState<{
    hasMediaRecorder: boolean;
    hasAudioSupport: boolean;
    supportedMimeTypes: string[];
  }>({ hasMediaRecorder: false, hasAudioSupport: false, supportedMimeTypes: [] });

  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

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

  const getSupportedMimeType = (): string | null => {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/wav'
    ];
    
    return mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || null;
  };

  useEffect(() => {
    const checkBrowserSupport = async () => {
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasAudioSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const supportedMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/wav']
        .filter(type => hasMediaRecorder && MediaRecorder.isTypeSupported(type));

      setBrowserSupport({
        hasMediaRecorder,
        hasAudioSupport,
        supportedMimeTypes
      });

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(result.state);
          
          result.addEventListener('change', () => {
            setPermissionState(result.state);
          });
        } catch (e) {
          console.debug('Permission query not supported');
        }
      }
    };

    checkBrowserSupport();
  }, []);

  // Add this useEffect to check permissions on mount and when component becomes visible
  useEffect(() => {
    const checkMicPermission = async () => {
      const state = await checkPermission('microphone');
      setPermissionState(state);
      
      // If permission is denied, set error with instructions
      if (state === 'denied') {
        setError(getPermissionInstructions('microphone'));
      }
    };

    checkMicPermission();

    // Check permission when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkMicPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

      // Request permission if not granted
      if (permissionState !== 'granted') {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          throw new Error(getPermissionInstructions('microphone'));
        }
        setPermissionState('granted');
      }

      if (!browserSupport.hasAudioSupport || !browserSupport.hasMediaRecorder) {
        throw new Error(
          `Your browser doesn't support audio recording. ${
            !browserSupport.hasMediaRecorder ? 'MediaRecorder API is not available. ' : ''
          }${!browserSupport.hasAudioSupport ? 'Audio capture is not supported. ' : ''
          }Please try a different browser like Chrome or Safari.`
        );
      }

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format found for your browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('AudioContext is not supported in this browser');
      }

      const audioContext = new AudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const cleanup = analyzeAudio(audioContext, stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType
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
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return isIOS 
        ? 'Microphone access denied. On iOS, go to Settings > Safari > Microphone and enable access.'
        : 'Microphone permission was denied. Please allow microphone access to record audio.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No microphone was found on your device.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return isIOS
        ? 'Cannot access microphone. Please close other apps that might be using it.'
        : 'Your microphone is busy or not accessible.';
    } else if (error.name === 'SecurityError') {
      return isIOS
        ? 'Recording requires a secure connection (HTTPS) and microphone permissions.'
        : 'Recording audio is not allowed in this context. Please ensure you\'re using HTTPS.';
    } else if (error.name === 'AbortError') {
      return 'Recording was interrupted. Please try again.';
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
          {permissionState === 'denied' && (
            <div className={styles.permissionHint}>
              {getPermissionInstructions('microphone')}
            </div>
          )}
        </div>
      )}
      <button
        onClick={handleStartRecording}
        onTouchStart={(e) => {
          e.preventDefault();
          if (!isRecording) {
            handleStartRecording();
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (isRecording) {
            handleStopRecording();
          }
        }}
        className={`${styles.recorderButton} ${!browserSupport.hasAudioSupport ? styles.disabled : ''}`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        disabled={!!error || !browserSupport.hasAudioSupport}
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
      {!browserSupport.hasAudioSupport && (
        <div className={styles.browserSupport}>
          Your browser doesn't support audio recording.
          Please try Chrome, Firefox, or Safari.
        </div>
      )}
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
