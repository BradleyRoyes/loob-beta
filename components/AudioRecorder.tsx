import React, { useState, useRef, useEffect } from "react";
import styles from "./AudioRecorder.module.css";
import { checkPermission, requestMicrophonePermission, getPermissionInstructions } from '../utils/permissions';

interface AudioRecorderProps {
  onRecordingComplete: (audioData: Blob) => void;
  startRecording: () => void;
  stopRecording: () => void;
  onCancel?: () => void;
  className?: string;
}

// Constants for audio chunking
const CHUNK_DURATION = 30000; // 30 seconds per chunk
const MAX_RECORDING_DURATION = 300000; // 5 minutes
const CHUNK_INTERVAL = 1000; // Get data every second
const CHUNK_SIZE = 1024 * 16; // 16KB chunks for better memory management

/**
 * AudioRecorder Component
 * A mobile-friendly audio recording component with visual feedback
 * and comprehensive error handling for various device scenarios.
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  startRecording: startRecordingProp,
  stopRecording: stopRecordingProp,
  onCancel,
}) => {
  // State management for recording status and audio visualization
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<Array<number>>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [recordingFormat, setRecordingFormat] = useState<string>('');
  
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

  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentChunkStartTime = useRef<number>(0);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const isMobile = () => {
    return /iPhone|iPad|iPod|Android|Mobile|webOS/i.test(navigator.userAgent);
  };

  /**
   * Function to format duration as MM:SS
   */
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Safely cleans up all audio resources and resets state
   * Called during component unmount and after recording stops
   */
  const cleanupRecording = () => {
    try {
      // Clear all intervals
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop and cleanup MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.debug('MediaRecorder was already stopped');
        }
      }
      mediaRecorderRef.current = null;

      // Stop all tracks and release stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {
            console.debug('Track was already stopped');
          }
        });
        streamRef.current = null;
      }

      // Disconnect and cleanup analyzer
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (e) {
          console.debug('Analyser was already disconnected');
        }
        analyserRef.current = null;
      }

      // Reset all state
      setIsRecording(false);
      setAudioLevel(0);
      setWaveformBars([]);
      setRecordingDuration(0);
      recordingStartTimeRef.current = null;
      currentChunkStartTime.current = 0;
      chunksRef.current = [];
      setStatusMessage('');
      setError(null);
    } catch (e) {
      console.error('Error during cleanup:', e);
      // Force reset of critical states even if cleanup fails
      setIsRecording(false);
      mediaRecorderRef.current = null;
      streamRef.current = null;
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
      
      // More responsive settings for the analyser
      analyser.fftSize = 512; // Increased for better frequency resolution
      analyser.minDecibels = -90; // Adjusted for better sensitivity
      analyser.maxDecibels = -10; // Adjusted for better range
      analyser.smoothingTimeConstant = 0.6; // Balanced smoothing

      microphone.connect(analyser);

      // Keep track of historical data for time progression
      const historyLength = 64; // Number of historical frames to keep
      const waveformHistory: number[][] = [];
      
      const updateWaveform = () => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const bars: number[] = [];
        const barCount = Math.min(32, Math.max(16, Math.floor(window.innerWidth / 24))); // Fewer, wider bars
        const segmentLength = Math.floor(dataArray.length / barCount);

        // Process current frame
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          let count = 0;
          
          const startIdx = Math.floor(i * segmentLength);
          const endIdx = Math.min(startIdx + segmentLength, dataArray.length);
          
          for (let j = startIdx; j < endIdx; j++) {
            // Enhanced frequency weighting with focus on speech frequencies
            const freq = (j * audioContext.sampleRate) / analyser.fftSize;
            const weight = 
              freq < 500 ? 2.0 : // Bass boost
              freq < 2000 ? 1.5 : // Mid boost (speech frequencies)
              freq < 4000 ? 1.2 : // High-mid
              0.8; // High frequencies
            
            sum += dataArray[j] * weight;
            count++;
          }

          // Improved normalization with dynamic range compression
          const normalizedValue = Math.pow((sum / count) / 255, 0.7) * 100;
          const amplifiedValue = Math.max(15, Math.min(98, normalizedValue * 1.5));
          bars.push(amplifiedValue);
        }

        // Add current frame to history
        waveformHistory.push(bars);
        if (waveformHistory.length > historyLength) {
          waveformHistory.shift();
        }

        // Combine current and historical data for visualization
        const combinedBars = bars.map((currentValue, index) => {
          // Get historical values for this bar position
          const history = waveformHistory.map(frame => frame[index] || 0);
          
          // Calculate a decaying influence from historical values
          const historicalInfluence = history.reduce((acc, val, i) => {
            const age = (history.length - i) / history.length;
            return acc + (val * age * 0.3); // 0.3 controls historical influence strength
          }, 0) / history.length;

          // Blend current value with historical influence
          return Math.max(currentValue, historicalInfluence);
        });

        setWaveformBars(combinedBars);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      analyserRef.current = analyser;
      updateWaveform();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        try {
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
    // Special case for iOS - prefer mp4/aac
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return 'audio/mp4';
      }
      if (MediaRecorder.isTypeSupported('audio/aac')) {
        return 'audio/aac';
      }
      // Fallback to m4a which is common on iOS
      if (MediaRecorder.isTypeSupported('audio/x-m4a')) {
        return 'audio/x-m4a';
      }
    }

    // For other mobile devices
    if (isMobile()) {
      const mobileMimeTypes = [
        'audio/mp4',
        'audio/aac',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/wav'
      ];
      return mobileMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || null;
    }

    // Desktop formats
    const desktopMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];
    return desktopMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || null;
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

  // Add device detection helper
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const android = /Android/.test(ua);
    const mobile = /Mobile|webOS/.test(ua);
    const safari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const chrome = /Chrome/.test(ua);

    return {
      iOS,
      android,
      mobile,
      safari,
      chrome,
      userAgent: ua
    };
  };

  /**
   * Initiates audio recording with error handling for various scenarios
   * Handles mobile-specific permission requests and browser compatibility
   */
  const handleStartRecording = async () => {
    try {
      // Reset state and cleanup before starting new recording
      cleanupRecording();
      setError(null);
      setStatusMessage('Initializing recording...');

      const deviceInfo = getDeviceInfo();
      console.log('Starting recording on device:', deviceInfo);

      // Check if already recording
      if (isRecording) {
        handleStopRecording();
        return;
      }

      // Request permission if not granted
      if (permissionState !== 'granted') {
        setStatusMessage('Requesting microphone permission...');
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

      // Log supported formats
      const supportedFormats = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/aac',
        'audio/x-m4a',
        'audio/wav'
      ].filter(format => MediaRecorder.isTypeSupported(format));

      console.log('Supported audio formats:', {
        formats: supportedFormats,
        deviceInfo
      });

      const mimeType = getSupportedMimeType();
      console.log('Selected MIME type:', {
        mimeType,
        deviceInfo
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(isMobile() && {
            channelCount: 1,
            sampleRate: 44100,
          }),
          ...(/iPad|iPhone|iPod/.test(navigator.userAgent) && {
            // iOS-specific constraints
            sampleSize: 16,
            channelCount: 1,
            sampleRate: 44100,
            // These are important for iOS
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
          })
        }
      });
      
      setStatusMessage('Microphone connected successfully');
      
      streamRef.current = stream;
      recordingStartTimeRef.current = Date.now();
      currentChunkStartTime.current = Date.now();

      // Start duration tracking
      recordingIntervalRef.current = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const duration = Date.now() - recordingStartTimeRef.current;
          setRecordingDuration(duration);

          // Check if we've exceeded max duration
          if (duration >= MAX_RECORDING_DURATION) {
            handleStopRecording();
            return;
          }
        }
      }, 100);

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
        mimeType: mimeType || 'audio/webm',
        ...(isMobile() && {
          audioBitsPerSecond: 128000,
        })
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('Data available:', {
          chunkSize: e.data.size,
          chunkType: e.data.type,
          timestamp: new Date().toISOString()
        });
        
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          setStatusMessage(`Recording... (${formatDuration(recordingDuration)})`);
        } else {
          console.warn('Empty chunk received');
          setStatusMessage('Warning: No audio data received');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('An error occurred during recording');
        setStatusMessage('Recording failed');
        cleanupRecording();
      };

      mediaRecorder.onstop = () => {
        cleanup();
        if (chunksRef.current.length === 0) {
          setError('No audio data was captured');
          setStatusMessage('Recording failed - no audio data');
          return;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Set up regular data requests
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      }, CHUNK_INTERVAL);

      setIsRecording(true);
      startRecordingProp();

    } catch (error: any) {
      console.error('Recording error:', {
        error,
        deviceInfo: getDeviceInfo(),
        message: error.message,
        name: error.name
      });
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setStatusMessage('Recording failed to start');
      cleanupRecording();
      
      // Reset state after error
      setIsRecording(false);
      if (onCancel) {
        onCancel();
      }
    }
  };

  const handleCancelRecording = () => {
    cleanupRecording();
    // Call the onCancel callback if provided
    if (onCancel) {
      onCancel();
    }
  };

  const handleConfirmRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    const deviceInfo = getDeviceInfo();
    console.log('Device Info:', deviceInfo);
    
    setStatusMessage('Processing audio...');
    const audioBlob = new Blob(chunksRef.current, { 
      type: mediaRecorderRef.current.mimeType || 'audio/webm' 
    });

    // Enhanced debug logging
    console.log('Recording Details:', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      numberOfChunks: chunksRef.current.length,
      chunks: chunksRef.current.map(chunk => ({
        size: chunk.size,
        type: chunk.type
      })),
      mimeType: mediaRecorderRef.current.mimeType,
      deviceInfo,
      recordingDuration,
      audioContext: {
        sampleRate: analyserRef.current?.context?.sampleRate,
        state: analyserRef.current?.context?.state
      }
    });

    if (audioBlob.size === 0) {
      setError('No audio data was captured');
      setStatusMessage('Recording failed - no audio data');
      return;
    }
    
    setStatusMessage('Sending to transcription service...');
    stopRecordingProp();
    onRecordingComplete(audioBlob);
    cleanupRecording();
  };

  /**
   * Safely stops recording and handles any errors during the process
   */
  const handleStopRecording = () => {
    try {
      if (!mediaRecorderRef.current || !isRecording) return;
      
      stopRecordingProp();
      cleanupRecording();
      
      // Reset state
      setIsRecording(false);
      setStatusMessage('');
      setError(null);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setError('Failed to stop recording properly');
      cleanupRecording();
      
      // Reset state after error
      setIsRecording(false);
      if (onCancel) {
        onCancel();
      }
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

  // Update waveform visualization
  useEffect(() => {
    if (isRecording && analyserRef.current) {
      const updateWaveform = () => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        const bars: number[] = [];
        const barCount = Math.min(64, Math.max(32, Math.floor(window.innerWidth / 12))); // Responsive bar count
        const segmentLength = Math.floor(dataArray.length / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          let count = 0;
          for (let j = 0; j < segmentLength; j++) {
            const value = Math.abs(dataArray[i * segmentLength + j] - 128) / 128;
            sum += value;
            count++;
          }
          // Enhanced visualization with smoother transitions
          const normalizedValue = (sum / count) * 100;
          // Apply exponential smoothing for more natural movement
          const smoothedValue = Math.pow(normalizedValue, 1.3);
          // Add minimum height and amplify the signal
          const amplifiedValue = Math.max(15, Math.min(95, smoothedValue * 4));
          bars.push(amplifiedValue);
        }

        setWaveformBars(bars);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setWaveformBars([]); // Clear waveform when not recording
    }
  }, [isRecording]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  return (
    <div className={`${styles.container} ${isRecording ? styles.recording : ''}`}>
      {/* Simplified error message */}
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error.includes('permission') ? 'Microphone access needed' : 'Recording failed'}
        </div>
      )}

      {/* Simplified status message */}
      {statusMessage && (
        <div className={styles.statusContainer}>
          <div className={styles.statusMessage}>
            {statusMessage.includes('Recording...') ? 'Recording...' : statusMessage}
          </div>
        </div>
      )}

      <div className={styles.recordingContainer}>
        <div className={styles.waveformContainer}>
          <div className={styles.waveform}>
            {waveformBars.map((height, index) => (
              <div
                key={index}
                className={styles.waveformBar}
                style={{
                  height: `${height}%`,
                  opacity: Math.max(0.4, height / 100)
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.duration}>
          {formatDuration(recordingDuration)}
        </div>
      </div>

      <div className={styles.buttonsContainer}>
        {isRecording && (
          <button
            className={styles.cancelButton}
            onClick={handleCancelRecording}
            aria-label="Cancel recording"
          >
            <CloseIcon />
          </button>
        )}
        <button
          onClick={isRecording ? handleConfirmRecording : handleStartRecording}
          className={styles.confirmButton}
          aria-label={isRecording ? "Send recording" : "Start recording"}
          disabled={!!error || !browserSupport.hasAudioSupport}
        >
          {isRecording ? <CheckIcon /> : <MicIcon />}
        </button>
      </div>

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

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

export default AudioRecorder;
