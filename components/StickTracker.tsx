'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { ColorResult, SketchPicker } from 'react-color';
import { PoseDetectionService } from '../lib/ml/poseDetection';
import { MLService, MLBackend } from '../lib/ml/MLService';

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
  keypoints: Array<{x: number, y: number, score?: number, name?: string}>;
  score: number;
  timestamp: number;
}

interface TrackingData {
  pose: PoseData | null;
  stick: StickData | null;
  frameRate: number;
}

// Define color threshold type
type ColorName = 'white' | 'black' | 'orange' | 'green' | 'blue';

interface ColorThreshold {
  r: number;
  g: number;
  b: number;
  tolerance: number;
}

interface ProcessedVideo {
  url: string;
  thumbnail?: string;
}

const DEFAULT_COLOR_THRESHOLDS: Record<ColorName, ColorThreshold> = {
  white: { r: 255, g: 255, b: 255, tolerance: 30 },
  black: { r: 0, g: 0, b: 0, tolerance: 30 },
  orange: { r: 255, g: 165, b: 0, tolerance: 30 },
  green: { r: 0, g: 255, b: 0, tolerance: 30 },
  blue: { r: 0, g: 0, b: 255, tolerance: 30 },
};

export default function StickTracker() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData>({
    pose: null,
    stick: null,
    frameRate: 0
  });
  const [endColors, setEndColors] = useState<[ColorName, ColorName]>(['orange', 'orange']);
  const [debugMode, setDebugMode] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [colorThresholds] = useState(DEFAULT_COLOR_THRESHOLDS);
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
  const poseService = useRef<PoseDetectionService>();
  const mlService = useRef<MLService>();
  const [backend, setBackend] = useState<MLBackend>('tflite');

  // Initialize TensorFlow and PoseNet
  useEffect(() => {
    let isMounted = true;

    const loadPoseNet = async () => {
      try {
        setStatus('Loading TensorFlow.js and PoseNet model...');
        
        // Initialize TensorFlow
        if (!tf.getBackend()) {
          await tf.setBackend('webgl');
          await tf.ready();
        }
        
        if (!isMounted) return;
        
        console.log('TensorFlow backend initialized:', tf.getBackend());

        // Load PoseNet if not already loaded
        if (!modelLoaded.current) {
          const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableTracking: true,
            trackerType: poseDetection.TrackerType.BoundingBox,
          };
          const poseDetector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
          );
          poseService.current = new PoseDetectionService({
            modelType: 'MoveNet',
            enableTracking: true,
            minPoseScore: 0.3
          });
          await poseService.current.initialize();
          modelLoaded.current = true;
          setStatus('Ready! Click Start Tracking to begin');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing:', error);
        setStatus(`Error initializing: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    loadPoseNet();

    return () => {
      isMounted = false;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Initialize ML service
  useEffect(() => {
    let isMounted = true;

    const initializeML = async () => {
      try {
        setStatus('Initializing ML service...');
        
        mlService.current = new MLService({
          backend,
          modelType: 'MoveNet',
          enableTracking: true,
          minPoseScore: 0.3,
          useWebGPU: true
        });
        
        await mlService.current.initialize();
        
        if (!isMounted) return;
        
        setStatus('ML service ready! Click Start Camera to begin.');
      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing ML service:', error);
        setStatus(`Error initializing: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initializeML();

    return () => {
      isMounted = false;
      mlService.current?.dispose();
    };
  }, [backend]);

  // Process video frame
  const processFrame = useCallback(async () => {
    if (!webcamRef.current?.video || !canvasRef.current || !mlService.current || processingFrame.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    processingFrame.current = true;
    const now = Date.now();

    try {
      // Detect pose
      const poses = await mlService.current.detectPose(video);
      const pose = poses[0];

      // Detect stick endpoints
      const end1 = await mlService.current.detectColor(
        video,
        [colorThresholds[endColors[0]].r, colorThresholds[endColors[0]].g, colorThresholds[endColors[0]].b],
        colorThresholds[endColors[0]].tolerance
      );

      const end2 = await mlService.current.detectColor(
        video,
        [colorThresholds[endColors[1]].r, colorThresholds[endColors[1]].g, colorThresholds[endColors[1]].b],
        colorThresholds[endColors[1]].tolerance
      );

      if (pose && end1 && end2) {
        const midpoint = {
          x: (end1.x + end2.x) / 2,
          y: (end1.y + end2.y) / 2
        };

        // Draw debug view if enabled
        if (debugMode) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawDebugView(ctx, pose.keypoints, [
            { ...end1, color: endColors[0] },
            { ...end2, color: endColors[1] }
          ], midpoint);
        }

        // Calculate frame rate
        const frameTime = now - lastFrameTime.current;
        const instantFPS = 1000 / frameTime;
        const smoothedFPS = 0.9 * trackingData.frameRate + 0.1 * instantFPS;

        setTrackingData({
          pose: {
            keypoints: pose.keypoints,
            score: pose.score || 0,
            timestamp: now
          },
          stick: {
            endpoints: [
              { ...end1, color: endColors[0] },
              { ...end2, color: endColors[1] }
            ],
            midpoint,
            timestamp: now
          },
          frameRate: smoothedFPS
        });

        lastFrameTime.current = now;
      }
    } catch (error) {
      console.error('Frame processing error:', error);
    } finally {
      processingFrame.current = false;
    }
  }, [endColors, debugMode, colorThresholds, trackingData.frameRate]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (isTracking) {
        processFrame();
      }
      rafId.current = requestAnimationFrame(animate);
    };

    if (isTracking) {
      animate();
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isTracking, processFrame]);

  // Draw debug visualization
  const drawDebugView = useCallback((
    ctx: CanvasRenderingContext2D,
    keypoints: Array<{x: number, y: number, score?: number}>,
    endpoints: [StickEndpoint, StickEndpoint],
    midpoint: { x: number; y: number }
  ) => {
    // Draw keypoints
    keypoints.forEach(keypoint => {
      if ((keypoint.score || 0) > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'yellow';
        ctx.fill();
      }
    });

    // Draw stick endpoints
    endpoints.forEach(endpoint => {
      ctx.beginPath();
      ctx.arc(endpoint.x, endpoint.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = endpoint.color;
      ctx.fill();
    });

    // Draw midpoint and connecting lines
    ctx.beginPath();
    ctx.arc(midpoint.x, midpoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(endpoints[0].x, endpoints[0].y);
    ctx.lineTo(midpoint.x, midpoint.y);
    ctx.lineTo(endpoints[1].x, endpoints[1].y);
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
            value={backend}
            onChange={(e) => setBackend(e.target.value as MLBackend)}
          >
            <option value="tflite">TensorFlow Lite</option>
            <option value="tfjs">TensorFlow.js</option>
          </select>
          <select
            className="bg-gray-800 text-white rounded px-3 py-2"
            value={endColors[0]}
            onChange={(e) => setEndColors([e.target.value as ColorName, endColors[1]])}
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
            onChange={(e) => setEndColors([endColors[0], e.target.value as ColorName])}
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
            FPS: {Math.round(trackingData.frameRate)}
          </div>
        </div>
      </div>

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