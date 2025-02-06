'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { ColorResult, SketchPicker } from 'react-color';

interface StickEndpoint {
  x: number;
  y: number;
  color: string;
  confidence: number;
}

interface StickData {
  endpoints: [StickEndpoint, StickEndpoint];
  midpoint: { x: number; y: number };
  timestamp: number;
}

interface PoseData {
  keypoints: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
  score: number;
  timestamp: number;
}

interface TrackingData {
  pose: PoseData | null;
  stick: StickData | null;
  frameRate: number;
}

interface ColorThreshold {
  hue: number;
  saturation: number;
  value: number;
  tolerance: number;
}

interface ProcessedVideo {
  url: string;
  thumbnail?: string;
}

const DEFAULT_COLOR_THRESHOLDS = {
  white: { hue: 0, saturation: 0, value: 100, tolerance: 20 },
  black: { hue: 0, saturation: 0, value: 0, tolerance: 20 },
  orange: { hue: 30, saturation: 100, value: 100, tolerance: 15 },
  green: { hue: 120, saturation: 100, value: 100, tolerance: 15 },
  blue: { hue: 240, saturation: 100, value: 100, tolerance: 15 },
  glow: { hue: 60, saturation: 20, value: 100, tolerance: 25 }
};

export default function StickTracker() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker>();
  const [trackingData, setTrackingData] = useState<TrackingData>({
    pose: null,
    stick: null,
    frameRate: 0
  });
  const [endColors, setEndColors] = useState<[string, string]>(['orange', 'orange']);
  const [debugMode, setDebugMode] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [colorThresholds, setColorThresholds] = useState(DEFAULT_COLOR_THRESHOLDS);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const processingFrame = useRef(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedVideo, setProcessedVideo] = useState<ProcessedVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordedChunks = useRef<Blob[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [cameraStatus, setCameraStatus] = useState('Initializing...');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout>();
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const rafId = useRef<number>();
  const modelLoaded = useRef(false);

  // Initialize TensorFlow and MoveNet
  useEffect(() => {
    let isMounted = true;

    const loadPoseLandmarker = async () => {
      try {
        setStatus('Loading TensorFlow.js and MoveNet model...');
        
        // Initialize TensorFlow
        if (!tf.getBackend()) {
          await tf.setBackend('webgl');
          await tf.ready();
        }
        
        if (!isMounted) return;
        
        console.log('TensorFlow backend initialized:', tf.getBackend());

        // Load MoveNet if not already loaded
        if (!modelLoaded.current) {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
          
          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
          });
          
          if (!isMounted) return;
          
          setPoseLandmarker(landmarker);
          modelLoaded.current = true;
          setStatus('Ready! Click Start Tracking to begin');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing:', error);
        setStatus(`Error initializing: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    loadPoseLandmarker();

    return () => {
      isMounted = false;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Color detection using canvas pixel manipulation
  const detectColor = useCallback((imageData: ImageData, threshold: ColorThreshold): { x: number, y: number, confidence: number } | null => {
    const { data, width, height } = imageData;
    let points: Array<{ x: number, y: number }> = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert RGB to HSV
      const [h, s, v] = rgbToHsv(r, g, b);
      
      // Check if color matches threshold
      if (Math.abs(h - threshold.hue) <= threshold.tolerance &&
          Math.abs(s - threshold.saturation) <= threshold.tolerance &&
          Math.abs(v - threshold.value) <= threshold.tolerance) {
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        points.push({ x, y });
      }
    }
    
    if (points.length === 0) return null;
    
    // Calculate centroid
    const centroid = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    
    return {
      x: centroid.x / points.length / width,
      y: centroid.y / points.length / height,
      confidence: Math.min(1, points.length / (width * height * 0.01)) // Normalize confidence
    };
  }, []);

  // Process video frame
  const processFrame = useCallback(async () => {
    if (!webcamRef.current?.video || !canvasRef.current || !poseLandmarker || processingFrame.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    processingFrame.current = true;

    try {
      // Update frame rate
      const now = Date.now();
      if (frameCount.current % 30 === 0) {
        const fps = 1000 / ((now - lastFrameTime.current) / 30);
        setTrackingData(prev => ({ ...prev, frameRate: Math.round(fps) }));
        lastFrameTime.current = now;
      }
      frameCount.current++;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Detect pose using MoveNet
      const results = await poseLandmarker.detectForVideo(video, now);
      const pose = results.landmarks[0];
      
      // Detect colors for stick endpoints
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const endpointsData: StickEndpoint[] = [];

      for (const color of endColors) {
        const threshold = colorThresholds[color as keyof typeof colorThresholds];
        const result = detectColor(imageData, threshold);
        
        if (result) {
          endpointsData.push({
            ...result,
            color
          });
        }
      }

      // Update tracking data
      if (endpointsData.length >= 2 && pose) {
        const [end1, end2] = endpointsData;
        const midpoint = {
          x: (end1.x + end2.x) / 2,
          y: (end1.y + end2.y) / 2
        };

        setTrackingData({
          pose: {
            keypoints: pose.map(point => ({
              x: point.x * canvas.width,
              y: point.y * canvas.height,
              z: point.z,
              visibility: point.visibility
            })),
            score: results.segmentationMasks?.[0] ? 1.0 : 0.0,
            timestamp: now
          },
          stick: {
            endpoints: [end1, end2],
            midpoint,
            timestamp: now
          },
          frameRate: trackingData.frameRate
        });

        if (debugMode) {
          drawDebugView(ctx, pose, [end1, end2], midpoint);
        }
      }
    } catch (error) {
      console.error('Frame processing error:', error);
    } finally {
      processingFrame.current = false;
    }
  }, [poseLandmarker, endColors, colorThresholds, debugMode, trackingData.frameRate]);

  // Draw debug visualization
  const drawDebugView = useCallback((
    ctx: CanvasRenderingContext2D,
    pose: Array<{x: number, y: number, z: number, visibility?: number}>,
    endpoints: [StickEndpoint, StickEndpoint],
    midpoint: { x: number; y: number }
  ) => {
    const canvas = ctx.canvas;

    // Draw pose keypoints
    pose.forEach(keypoint => {
      if (keypoint.visibility && keypoint.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(
          keypoint.x * canvas.width,
          keypoint.y * canvas.height,
          5,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = 'aqua';
        ctx.fill();
      }
    });

    // Draw stick endpoints
    endpoints.forEach(endpoint => {
      ctx.beginPath();
      ctx.arc(
        endpoint.x * canvas.width,
        endpoint.y * canvas.height,
        8,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = endpoint.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw stick midpoint and line
    ctx.beginPath();
    ctx.arc(
      midpoint.x * canvas.width,
      midpoint.y * canvas.height,
      4,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = 'yellow';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(
      endpoints[0].x * canvas.width,
      endpoints[0].y * canvas.height
    );
    ctx.lineTo(
      endpoints[1].x * canvas.width,
      endpoints[1].y * canvas.height
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  // Handle starting/stopping tracking
  const handleTrackingToggle = () => {
    if (!isWebcamReady) {
      setStatus('Please start the camera first');
      return;
    }
    
    setIsTracking(!isTracking);
    if (!isTracking) {
      setCameraStatus('Tracking active');
      setStatus('Tracking started - detecting pose and stick endpoints');
      // Start the animation loop
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      animate();
    } else {
      setCameraStatus('Tracking stopped');
      setStatus('Tracking stopped');
      if (isRecording) {
        stopRecording();
      }
      // Stop the animation loop
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    }
  };

  // Animation loop
  const animate = useCallback(() => {
    if (isTracking && !processingFrame.current) {
      processFrame();
    }
    rafId.current = requestAnimationFrame(animate);
  }, [isTracking]);

  // Handle video upload and processing
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTracking(false);
    setUploadedVideo(file);
    setIsProcessing(true);
    setStatus('Processing video...');

    const videoUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.muted = true;

    // Wait for video metadata to load
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = resolve;
    });

    // Set up canvas for recording
    if (canvasRef.current) {
      canvasRef.current.width = videoElement.videoWidth;
      canvasRef.current.height = videoElement.videoHeight;
    }

    // Set up MediaRecorder
    const stream = canvasRef.current!.captureStream(30); // 30 FPS
    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    recordedChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.current.push(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setProcessedVideo({
        url,
        thumbnail: canvasRef.current?.toDataURL('image/jpeg')
      });
      setIsProcessing(false);
      setStatus('Processing complete! You can now play or download the processed video.');
    };

    // Start recording and processing
    mediaRecorder.current.start();
    videoElement.play();

    // Process each frame
    const processVideoFrame = async () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoElement, 0, 0, canvasRef.current.width, canvasRef.current.height);
      await processFrame();

      if (!videoElement.ended && !videoElement.paused) {
        requestAnimationFrame(processVideoFrame);
      } else {
        mediaRecorder.current?.stop();
      }
    };

    processVideoFrame();
  };

  // Handle video playback controls
  const handlePlayPause = () => {
    if (uploadedVideoRef.current) {
      if (isPlaying) {
        uploadedVideoRef.current.pause();
      } else {
        uploadedVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle processed video download
  const handleDownload = () => {
    if (processedVideo) {
      const a = document.createElement('a');
      a.href = processedVideo.url;
      a.download = 'processed-flow-stick.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Animation loop
  useEffect(() => {
    let rafId: number;

    const animate = () => {
      if (isTracking) {
        processFrame();
      }
      rafId = requestAnimationFrame(animate);
    };

    if (isTracking) {
      animate();
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isTracking, processFrame]);

  // Utility function to convert HSV to RGB
  const hsvToRgb = (h: number, s: number, v: number): { r: number, g: number, b: number } => {
    s = s / 100;
    v = v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // Color calibration handlers
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setIsCalibrating(true);
  };

  const handleColorChange = (color: ColorResult) => {
    if (selectedColor) {
      const [h, s, v] = rgbToHsv(color.rgb.r, color.rgb.g, color.rgb.b);
      setColorThresholds(prev => ({
        ...prev,
        [selectedColor]: {
          hue: h,
          saturation: s,
          value: v,
          tolerance: prev[selectedColor as keyof typeof prev].tolerance
        }
      }));
    }
  };

  // Utility function to convert RGB to HSV
  const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff === 0) {
      h = 0;
    } else if (max === r) {
      h = 60 * ((g - b) / diff % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / diff + 2);
    } else {
      h = 60 * ((r - g) / diff + 4);
    }

    if (h < 0) h += 360;

    const s = max === 0 ? 0 : diff / max * 100;
    const v = max * 100;

    return [h, s, v];
  };

  // Start recording
  const startRecording = () => {
    if (!webcamRef.current?.video || !canvasRef.current) return;

    // Set up MediaRecorder for the canvas stream
    const stream = canvasRef.current.captureStream(30); // 30 FPS
    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    recordedChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.current.push(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setProcessedVideo({
        url,
        thumbnail: canvasRef.current?.toDataURL('image/jpeg')
      });
      setIsProcessing(false);
      setStatus('Recording complete! You can now play or download the video.');
    };

    // Start recording
    mediaRecorder.current.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start timer
    recordingTimer.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      // First ensure TensorFlow and MoveNet are initialized
      if (!modelLoaded.current) {
        setStatus('Please wait for model to initialize...');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
          frameRate: { ideal: 30 }
        }
      });
      
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
        setIsWebcamReady(true);
        setCameraStatus('Camera active');
        setStatus('Camera ready - click Start Tracking to begin');
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setCameraStatus(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('Failed to start camera');
    }
  };

  const stopWebcam = () => {
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      webcamRef.current.video.srcObject = null;
      setIsWebcamReady(false);
      setIsTracking(false);
      setCameraStatus('Camera stopped');
    }
  };

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Flow Stick Tracker</h2>
        <div className="space-x-4">
          <select
            className="bg-gray-800 text-white rounded px-3 py-2"
            value={endColors[0]}
            onChange={(e) => setEndColors([e.target.value as string, endColors[1]])}
          >
            {Object.keys(colorThresholds).map(color => (
              <option key={`end1-${color}`} value={color}>
                End 1: {color}
              </option>
            ))}
          </select>
          <select
            className="bg-gray-800 text-white rounded px-3 py-2"
            value={endColors[1]}
            onChange={(e) => setEndColors([endColors[0], e.target.value as string])}
          >
            {Object.keys(colorThresholds).map(color => (
              <option key={`end2-${color}`} value={color}>
                End 2: {color}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {!uploadedVideo ? (
          <>
            {!isWebcamReady ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-gray-400">{status}</p>
                  <button
                    onClick={startWebcam}
                    disabled={!modelLoaded.current}
                    className={`px-6 py-3 rounded-lg text-white font-medium ${
                      modelLoaded.current 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {modelLoaded.current ? 'Start Camera' : 'Loading Model...'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="absolute inset-0 w-full h-full"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: 'environment',
                    frameRate: { ideal: 30 }
                  }}
                  onUserMedia={() => setCameraStatus('Camera active')}
                  onUserMediaError={(err) => {
                    console.error('Webcam error:', err);
                    setCameraStatus(`Camera error: ${err.toString()}`);
                    setIsWebcamReady(false);
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  width={1280}
                  height={720}
                />
              </>
            )}
          </>
        ) : (
          <video
            ref={uploadedVideoRef}
            className="absolute inset-0 w-full h-full"
            playsInline
            muted
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Processing video...</p>
            </div>
          </div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            <span>Recording: {formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="space-x-4">
          {isWebcamReady && !uploadedVideo && !isRecording && (
            <button
              onClick={handleTrackingToggle}
              className={`px-6 py-3 rounded-lg font-medium ${
                isTracking
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
          )}

          {isTracking && !uploadedVideo && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          )}

          {!isTracking && !isRecording && (
            <>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium cursor-pointer"
              >
                Upload Video
              </label>
            </>
          )}

          {processedVideo && (
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium"
            >
              Download Processed Video
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="form-checkbox"
            />
            <span>Debug Mode</span>
          </label>
          <div className="text-sm text-gray-400">
            FPS: {trackingData.frameRate}
          </div>
        </div>
      </div>

      {isCalibrating && selectedColor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Calibrate {selectedColor}</h3>
            <SketchPicker
              color={(() => {
                const threshold = colorThresholds[selectedColor as keyof typeof colorThresholds];
                const rgb = hsvToRgb(threshold.hue, threshold.saturation, threshold.value);
                return { r: rgb.r, g: rgb.g, b: rgb.b };
              })()}
              onChange={handleColorChange}
            />
            <button
              onClick={() => setIsCalibrating(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {debugMode && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Debug Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Color Calibration</h4>
              {Object.entries(colorThresholds).map(([color, threshold]) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="block mb-2 px-3 py-1 bg-gray-800 rounded"
                >
                  Calibrate {color}
                </button>
              ))}
            </div>
            <pre className="text-sm">
              {JSON.stringify(trackingData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {processedVideo && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Processed Video</h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={processedVideo.url}
              controls
              className="w-full h-full"
              poster={processedVideo.thumbnail}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 text-center">
        <p className="text-sm text-gray-400">{status}</p>
        <p className="text-sm text-gray-400">{cameraStatus}</p>
      </div>
    </div>
  );
} 