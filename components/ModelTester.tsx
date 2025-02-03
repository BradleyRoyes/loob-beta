'use client';

import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { predictImage } from '@/lib/model';

export default function OrangeDetector() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [orangeObjects, setOrangeObjects] = useState<Array<cocossd.DetectedObject>>([]);
  const [modelStatus, setModelStatus] = useState('Loading model...');
  const [cameraStatus, setCameraStatus] = useState('Starting camera...');

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

  // Detection loop with frame skipping
  useEffect(() => {
    let frameCount = 0;
    let rafId: number;

    const detectFrame = async () => {
      if (!isRunning || !objectDetector.current || !webcamRef.current?.video) return;
      
      try {
      const video = webcamRef.current.video;
        if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;

        // Process every other frame to reduce load
        if (frameCount++ % 2 === 0) {
          const detections = await objectDetector.current.detect(video);
          const orangeItems = filterOrangeObjects(detections, video);
          setOrangeObjects(orangeItems);
          drawDetections(orangeItems, video);
        }
        
        rafId = requestAnimationFrame(detectFrame);
      } catch (error) {
        console.error('Detection error:', error);
        setIsRunning(false);
      }
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

  // Drawing optimizations
  const drawDetections = (detections: cocossd.DetectedObject[], video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw detections
    detections.forEach(obj => {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFA500';
      ctx.strokeRect(...obj.bbox);
      
      ctx.fillStyle = '#FFA500';
      ctx.fillText(
        `${obj.class} (${Math.round(obj.score * 100)}%)`,
        obj.bbox[0] + 5,
        obj.bbox[1] > 20 ? obj.bbox[1] - 5 : obj.bbox[1] + 15
      );
    });
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
      <h2 className="text-xl font-bold">Orange Object Detector</h2>
      
      {/* Status indicators */}
      <div className="space-y-2">
        <p className="text-sm text-gray-400">{modelStatus}</p>
        <p className="text-sm text-gray-400">{cameraStatus}</p>
      </div>

        <Webcam
          ref={webcamRef}
          className="w-full rounded-lg"
          audio={false}
        videoConstraints={{
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 360 }, // 16:9 aspect for better performance
          frameRate: { ideal: 15 }
        }}
        onUserMedia={() => setCameraStatus('Camera active')}
        onUserMediaError={(e) => setCameraStatus(`Camera error: ${e.toString()}`)}
      />

      <button
        onClick={() => setIsRunning(!isRunning)}
        className={`w-full p-4 rounded-lg ${
          isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        } text-white`}
      >
        {isRunning ? 'Stop Detection' : 'Start Detection'}
      </button>

      <div className="bg-gray-900 p-4 rounded-lg">
        <p className="text-2xl font-bold text-center">
          {orangeObjects.length} Orange Object{orangeObjects.length !== 1 ? 's' : ''} Detected
        </p>
      </div>
    </div>
  );
}
