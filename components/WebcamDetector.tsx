'use client';
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocossd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

export default function SimpleObjectDetector() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [model, setModel] = useState<cocossd.ObjectDetection>();
  const [status, setStatus] = useState('Loading model...');

  // Load model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatus('Loading TensorFlow backend...');
        await tf.setBackend('webgl');
        await tf.ready();
        
        setStatus('Loading COCO-SSD model...');
        const model = await cocossd.load();
        setModel(model);
        setStatus('Model loaded - click start to begin');
      } catch (err) {
        console.error(err);
        setStatus('Error initializing TensorFlow');
      }
    };

    loadModel();
  }, []);

  // Detection loop
  useEffect(() => {
    let animationId: number;

    const detect = async () => {
      if (!webcamRef.current?.video || !model || !canvasRef.current) return;

      // Get video properties
      const video = webcamRef.current.video;
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Set canvas dimensions
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Run detection every 200ms
      const detections = await model.detect(video);
      
      // Clear previous frame
      ctx.clearRect(0, 0, width, height);
      
      // Draw detections
      detections.forEach(detection => {
        const [x, y, width, height] = detection.bbox;
        
        // Draw bounding box
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label
        ctx.fillStyle = '#00FF00';
        ctx.font = '16px Arial';
        ctx.fillText(
          `${detection.class} (${Math.round(detection.score * 100)}%)`,
          x,
          y > 10 ? y - 5 : y + 20
        );
      });

      animationId = requestAnimationFrame(detect);
    };

    if (isDetecting) {
      detect();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isDetecting, model]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full rounded-lg"
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      <div className="mt-4 space-y-4">
        <button
          onClick={() => setIsDetecting(!isDetecting)}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
        <p className="text-center text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  );
} 