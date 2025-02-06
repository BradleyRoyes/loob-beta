'use client';

import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { predictImage } from '@/lib/model';

// Add type declaration for Performance.memory
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

interface DetectionStats {
  fps: number;
  avgConfidence: number;
  detectionCount: number;
  processingTime: number;
  frameSkips: number;
  memoryUsage: number;
}

interface ModelMetrics {
  loss: number[];
  accuracy: number[];
  validationLoss: number[];
  learningRate: number;
  epoch: number;
  batchesProcessed: number;
  totalBatches: number;
}

export default function ModelTester() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [orangeObjects, setOrangeObjects] = useState<Array<cocossd.DetectedObject>>([]);
  const [modelStatus, setModelStatus] = useState('Loading model...');
  const [cameraStatus, setCameraStatus] = useState('Starting camera...');
  const [stats, setStats] = useState<DetectionStats>({
    fps: 0,
    avgConfidence: 0,
    detectionCount: 0,
    processingTime: 0,
    frameSkips: 0,
    memoryUsage: 0
  });
  const [metrics, setMetrics] = useState<ModelMetrics>({
    loss: [],
    accuracy: [],
    validationLoss: [],
    learningRate: 0.001,
    epoch: 0,
    batchesProcessed: 0,
    totalBatches: 0
  });

  const lastFrameTime = useRef(Date.now());
  const frameCount = useRef(0);
  const processingTimes = useRef<number[]>([]);
  const confidenceHistory = useRef<number[]>([]);

  // COCO-SSD configuration
  const modelConfig = {
    base: 'lite_mobilenet_v2' as const, // Optimized for web
  };

  // Orange color thresholds
  const ORANGE_THRESHOLD = { 
    minHue: 5, 
    maxHue: 20,
    minSat: 40,
    minVal: 40
  };

  const objectDetector = useRef<cocossd.ObjectDetection>();

  // Load model with error handling
  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        setModelStatus('Loading COCO-SSD model...');
        objectDetector.current = await cocossd.load(modelConfig);
        if (isMounted) setModelStatus('Model loaded');
      } catch (error) {
        console.error('Model load error:', error);
        if (isMounted) setModelStatus('Error loading model');
      }
    };
    
    loadModel();
    return () => { isMounted = false; };
  }, []);

  // Enhanced stats tracking
  const updateStats = (detections: cocossd.DetectedObject[], processTime: number) => {
    const now = Date.now();
    const timeDiff = now - lastFrameTime.current;
    frameCount.current++;
    
    // Update processing times history (keep last 30 frames)
    processingTimes.current.push(processTime);
    if (processingTimes.current.length > 30) processingTimes.current.shift();
    
    // Update confidence history
    const avgConfidence = detections.reduce((acc, det) => acc + det.score, 0) / (detections.length || 1);
    confidenceHistory.current.push(avgConfidence);
    if (confidenceHistory.current.length > 100) confidenceHistory.current.shift();

    // Calculate stats
    setStats({
      fps: Math.round((1000 / timeDiff) * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      detectionCount: detections.length,
      processingTime: Math.round(processTime),
      frameSkips: frameCount.current % 2,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
    });

    lastFrameTime.current = now;
  };

  // Enhanced detection loop
  useEffect(() => {
    let rafId: number;
    let isProcessing = false;

    const detectFrame = async () => {
      if (!isRunning || !objectDetector.current || !webcamRef.current?.video || isProcessing) {
        rafId = requestAnimationFrame(detectFrame);
        return;
      }
      
      isProcessing = true;
      const startTime = performance.now();
      
      try {
        const video = webcamRef.current.video;
        if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
          rafId = requestAnimationFrame(detectFrame);
          return;
        }

        // Process every other frame
        if (frameCount.current++ % 2 === 0) {
          const detections = await objectDetector.current.detect(video);
          const orangeItems = filterOrangeObjects(detections, video);
          setOrangeObjects(orangeItems);
          drawDetections(orangeItems, video);
          
          const processTime = performance.now() - startTime;
          updateStats(orangeItems, processTime);

          // Update metrics
          setMetrics(prev => ({
            ...prev,
            accuracy: [...prev.accuracy, orangeItems.length > 0 ? 1 : 0].slice(-100),
            loss: [...prev.loss, 1 - (orangeItems[0]?.score || 0)].slice(-100)
          }));
        }
      } catch (error) {
        console.error('Detection error:', error);
        setModelStatus('Detection error occurred');
      }

      isProcessing = false;
      rafId = requestAnimationFrame(detectFrame);
    };

    if (isRunning) {
      detectFrame();
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isRunning]);

  // Optimized orange filtering
  const filterOrangeObjects = (detections: cocossd.DetectedObject[], video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    // Single capture per detection cycle
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return detections.filter(detection => {
      const centerX = Math.floor(detection.bbox[0] + detection.bbox[2]/2);
      const centerY = Math.floor(detection.bbox[1] + detection.bbox[3]/2);
      const pixelIndex = (centerY * imageData.width + centerX) * 4;
      
      const [h, s, v] = rgbToHsv(
        imageData.data[pixelIndex],
        imageData.data[pixelIndex + 1],
        imageData.data[pixelIndex + 2]
      );

      return h >= ORANGE_THRESHOLD.minHue && 
             h <= ORANGE_THRESHOLD.maxHue &&
             s >= ORANGE_THRESHOLD.minSat &&
             v >= ORANGE_THRESHOLD.minVal;
    });
  };

  // Enhanced drawing with more information
  const drawDetections = (detections: cocossd.DetectedObject[], video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw detections with enhanced visuals
    detections.forEach((obj, index) => {
      const [x, y, width, height] = obj.bbox;
      
      // Draw bounding box
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsl(${obj.score * 120}, 100%, 50%)`; // Color based on confidence
      ctx.strokeRect(x, y, width, height);
      
      // Draw background for text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y - 30, width, 30);
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(
        `${obj.class} (${Math.round(obj.score * 100)}%)`,
        x + 5,
        y - 10
      );
    });

    // Draw stats overlay
    drawStatsOverlay(ctx, canvas.width, canvas.height);
  };

  // New function to draw stats overlay
  const drawStatsOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 120);

    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${stats.fps}`, 20, 30);
    ctx.fillText(`Confidence: ${stats.avgConfidence.toFixed(2)}`, 20, 50);
    ctx.fillText(`Processing: ${stats.processingTime}ms`, 20, 70);
    ctx.fillText(`Memory: ${stats.memoryUsage}MB`, 20, 90);
    ctx.fillText(`Detections: ${stats.detectionCount}`, 20, 110);

    // Draw mini performance graph
    drawPerformanceGraph(ctx, width - 210, 10, 200, 100);
  };

  // New function to draw performance graph
  const drawPerformanceGraph = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, width, height);

    // Draw confidence history
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(75, 192, 192, 0.8)';
    ctx.lineWidth = 1;
    
    confidenceHistory.current.forEach((conf, i) => {
      const px = x + (i / confidenceHistory.current.length) * width;
      const py = y + height - (conf * height);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    
    ctx.stroke();
  };

  // RGB to HSV conversion
  const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
  };

  // Add a test button that uses your custom model
  const testCustomModel = async () => {
    const imgSrc = webcamRef.current?.getScreenshot();
    if (!imgSrc) return;

    const img = new Image();
    img.src = imgSrc;
    await new Promise((resolve) => img.onload = resolve);
    
    const prediction = await predictImage(img);
    // Visualize prediction coordinates
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">Model Tester</h2>
          <p className="text-sm text-gray-400">{modelStatus}</p>
          <p className="text-sm text-gray-400">{cameraStatus}</p>
        </div>
        
        {/* Stats Panel */}
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 min-w-[200px]">
          <h3 className="text-sm font-semibold text-gray-300">Performance Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-400">FPS:</div>
            <div className="text-right">{stats.fps}</div>
            <div className="text-gray-400">Confidence:</div>
            <div className="text-right">{stats.avgConfidence.toFixed(2)}</div>
            <div className="text-gray-400">Processing:</div>
            <div className="text-right">{stats.processingTime}ms</div>
            <div className="text-gray-400">Memory:</div>
            <div className="text-right">{stats.memoryUsage}MB</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Webcam
          ref={webcamRef}
          className="w-full rounded-lg"
          audio={false}
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 30 }
          }}
          onUserMedia={() => setCameraStatus('Camera active')}
          onUserMediaError={(e) => setCameraStatus(`Camera error: ${e.toString()}`)}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`p-4 rounded-lg ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          {isRunning ? 'Stop Detection' : 'Start Detection'}
        </button>
        
        <button
          onClick={testCustomModel}
          className="p-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          Test Custom Model
        </button>
      </div>

      {/* Metrics Visualization */}
      <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Detection Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Detection Count</p>
            <div className="h-20 bg-gray-800/50 rounded overflow-hidden">
              {/* Add bar chart visualization */}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Confidence History</p>
            <div className="h-20 bg-gray-800/50 rounded overflow-hidden">
              {/* Add line chart visualization */}
            </div>
          </div>
        </div>
      </div>

      {/* Detection Results */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Detection Results</h3>
        <div className="space-y-2">
          {orangeObjects.map((obj, i) => (
            <div 
              key={i}
              className="flex justify-between items-center bg-gray-800/50 rounded p-2 text-sm"
            >
              <span>{obj.class}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${obj.score * 100}%` }}
                  />
                </div>
                <span className="text-xs">{Math.round(obj.score * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}