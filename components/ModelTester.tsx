'use client';

import React, { useRef, useEffect, useState } from 'react';
import { modelManager, predictImage } from '@/lib/model';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

type ModelType = 'custom' | 'coco-ssd';
type DetectionMode = 'ball-tracking' | 'object-detection';

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SavedModel {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  path: string;
  type: 'custom' | 'uploaded';
  metadata?: {
    trainedOn?: string;
    accuracy?: number;
    notes?: string;
  };
}

export default function ModelTester() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);
  const [modelType, setModelType] = useState<ModelType>('custom');
  const [detectionMode, setDetectionMode] = useState<DetectionMode>('ball-tracking');
  const [hasCustomModel, setHasCustomModel] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [cocoModel, setCocoModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<Array<{
    class: string;
    score: number;
    bbox: [number, number, number, number];
  }>>([]);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const [showTrail, setShowTrail] = useState(true);
  const trailLength = 50; // number of points to keep in trail
  
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for custom model on mount
  useEffect(() => {
    const checkCustomModel = async () => {
      try {
        setIsModelLoading(true);
        const model = await modelManager.getModel();
        setHasCustomModel(true);
      } catch (err) {
        console.warn('No custom model found:', err);
        setHasCustomModel(false);
        // Default to COCO-SSD if no custom model
        setModelType('coco-ssd');
      } finally {
        setIsModelLoading(false);
      }
    };
    checkCustomModel();
  }, []);

  // Load COCO-SSD model when selected
  useEffect(() => {
    if (modelType === 'coco-ssd' && !cocoModel) {
      const loadCocoModel = async () => {
        setIsModelLoading(true);
        try {
          const model = await cocoSsd.load();
          setCocoModel(model);
        } catch (err) {
          console.error('Failed to load COCO-SSD model:', err);
          setError('Failed to load object detection model');
        } finally {
          setIsModelLoading(false);
        }
      };
      loadCocoModel();
    }
  }, [modelType]);

  useEffect(() => {
    // Add resize handler to keep canvas matched with video
    const handleResize = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        canvasRef.current.width = video.clientWidth;
        canvasRef.current.height = video.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // Keep existing cleanup code
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            // Set canvas size to match video
            canvasRef.current.width = videoRef.current.clientWidth;
            canvasRef.current.height = videoRef.current.clientHeight;
            setIsWebcamActive(true);
            startPredicting();
          }
        };
      }
    } catch (err) {
      setError('Failed to access webcam. Please ensure you have granted camera permissions.');
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
      setPredictions(null);
      setIsTracking(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const drawTrail = (ctx: CanvasRenderingContext2D) => {
    if (trailPoints.length < 2) return;

    // Create gradient for trail
    const gradient = ctx.createLinearGradient(
      trailPoints[0].x * ctx.canvas.width,
      trailPoints[0].y * ctx.canvas.height,
      trailPoints[trailPoints.length - 1].x * ctx.canvas.width,
      trailPoints[trailPoints.length - 1].y * ctx.canvas.height
    );
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');

    // Draw main trail
    ctx.beginPath();
    ctx.moveTo(
      trailPoints[0].x * ctx.canvas.width,
      trailPoints[0].y * ctx.canvas.height
    );

    // Use curve instead of straight lines
    for (let i = 1; i < trailPoints.length - 2; i++) {
      const xc = (trailPoints[i].x + trailPoints[i + 1].x) / 2 * ctx.canvas.width;
      const yc = (trailPoints[i].y + trailPoints[i + 1].y) / 2 * ctx.canvas.height;
      const x = trailPoints[i].x * ctx.canvas.width;
      const y = trailPoints[i].y * ctx.canvas.height;
      ctx.quadraticCurveTo(x, y, xc, yc);
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
  };

  const updateTrail = (x: number, y: number) => {
    const now = Date.now();
    setTrailPoints(prev => {
      const newPoints = [...prev, { x, y, timestamp: now }];
      // Keep only recent points
      return newPoints.slice(-trailLength);
    });
  };

  const drawHUDOverlay = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const time = Date.now() / 1000;

    // Dancing background waves
    const waveCount = 3;
    for (let w = 0; w < waveCount; w++) {
      const waveGradient = ctx.createLinearGradient(0, 0, width, height);
      const phase = time * (0.5 + w * 0.2);
      const alpha = 0.1 + Math.sin(phase) * 0.05;
      waveGradient.addColorStop(0, `rgba(0, ${20 + w * 20}, ${40 + w * 20}, ${alpha})`);
      waveGradient.addColorStop(0.5, `rgba(${60 - w * 20}, 0, ${80 + w * 20}, ${alpha})`);
      waveGradient.addColorStop(1, `rgba(0, ${40 + w * 20}, ${60 + w * 20}, ${alpha})`);
      
      ctx.fillStyle = waveGradient;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x < width; x += 10) {
        const y = Math.sin(x * 0.01 + phase) * 50 + 
                 Math.cos(x * 0.02 - phase * 1.5) * 30;
        ctx.lineTo(x, y + height * (w + 1) / (waveCount + 1));
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    // Dancing particles with trails
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const baseX = width * (i / particleCount);
      const speed = 1 + Math.sin(i * 0.5) * 0.5;
      const wobble = Math.sin(time * 3 + i) * 30;
      const x = baseX + wobble;
      const y = ((time * speed * 100) + (i * 50)) % height;
      
      // Particle trail
      const trailLength = 5;
      for (let t = 0; t < trailLength; t++) {
        const trailY = y - t * 15;
        const size = (2 + Math.sin(time * 4 + i) * 1) * (1 - t/trailLength);
        const alpha = (0.5 + Math.sin(time * 2 + i) * 0.3) * (1 - t/trailLength);
        const wobbleOffset = Math.sin(time * 3 + i - t * 0.5) * 30;
        const trailX = baseX + wobbleOffset;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dancing hexagonal grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    const hexSize = 50 + Math.sin(time * 2) * 10;
    const rows = Math.ceil(height / (hexSize * 1.5));
    const cols = Math.ceil(width / (hexSize * Math.sqrt(3)));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseX = col * hexSize * Math.sqrt(3);
        const baseY = row * hexSize * 1.5;
        const offset = (row % 2) * (hexSize * Math.sqrt(3) / 2);
        const wobbleX = Math.sin(time * 2 + row * 0.5 + col * 0.5) * 10;
        const wobbleY = Math.cos(time * 1.5 + row * 0.3 + col * 0.3) * 10;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 + time * 0.2 + Math.sin(time + row * 0.2 + col * 0.2) * 0.2;
          const hx = baseX + offset + Math.cos(angle) * hexSize + wobbleX;
          const hy = baseY + Math.sin(angle) * hexSize + wobbleY;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Dancing energy field
    const fieldLines = 12;
    for (let i = 0; i < fieldLines; i++) {
      const angle = (i / fieldLines) * Math.PI * 2 + time;
      const danceRadius = width * (0.4 + Math.sin(time * 2 + i) * 0.1);
      const gradient = ctx.createLinearGradient(
        width/2 + Math.cos(angle) * danceRadius,
        height/2 + Math.sin(angle) * danceRadius,
        width/2,
        height/2
      );
      
      const pulseIntensity = 0.1 + Math.sin(time * 3 + i) * 0.05;
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.5, `rgba(0, 255, 255, ${pulseIntensity})`);
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(width/2, height/2);
      
      // Create curved energy lines
      const cp1x = width/2 + Math.cos(angle + Math.sin(time)) * danceRadius * 0.5;
      const cp1y = height/2 + Math.sin(angle + Math.cos(time)) * danceRadius * 0.5;
      const cp2x = width/2 + Math.cos(angle - Math.sin(time)) * danceRadius * 0.75;
      const cp2y = height/2 + Math.sin(angle - Math.cos(time)) * danceRadius * 0.75;
      const endX = width/2 + Math.cos(angle) * danceRadius;
      const endY = height/2 + Math.sin(angle) * danceRadius;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();
    }

    // Dancing scan line
    const scanY = (Math.sin(time * 2) + 1) / 2 * height;
    const scanHeight = 40 + Math.sin(time * 4) * 20;
    const scanGradient = ctx.createLinearGradient(0, scanY - scanHeight/2, 0, scanY + scanHeight/2);
    scanGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    scanGradient.addColorStop(0.2, 'rgba(0, 255, 255, 0.1)');
    scanGradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.6 + Math.sin(time * 5) * 0.2})`);
    scanGradient.addColorStop(0.8, 'rgba(0, 255, 255, 0.1)');
    scanGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.fillStyle = scanGradient;
    ctx.fillRect(0, scanY - scanHeight/2, width, scanHeight);

    // Enhanced status display with cyber effect
    const drawCyberText = (text: string, x: number, y: number) => {
      const glitchOffset = Math.sin(time * 10) > 0.9 ? Math.random() * 4 - 2 : 0;
      
      // Text shadow for depth
      ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
      ctx.shadowBlur = 15;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';

      // Main text
      ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.fillText(text, x + glitchOffset, y);

      // Glitch effect
      if (Math.random() > 0.95) {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.fillText(text, x + 2, y);
      }
    };

    drawCyberText(`FPS: ${fps.toFixed(1)}`, 20, 30);
    drawCyberText(`STATUS: ${isTracking ? 'TRACKING TARGET' : 'SCANNING...'}`, 20, 60);
    
    if (isTracking) {
      const pulseOpacity = (Math.sin(time * 8) + 1) / 2;
      ctx.fillStyle = `rgba(0, 255, 255, ${0.7 + pulseOpacity * 0.3})`;
      drawCyberText('TARGET LOCKED', 20, 90);

      // Add warning triangles when locked
      const triangleSize = 10;
      const triangleOffset = Math.sin(time * 5) * 5;
      ctx.fillStyle = `rgba(255, 50, 50, ${0.5 + pulseOpacity * 0.5})`;
      
      // Draw warning triangles
      for (let i = 0; i < 2; i++) {
        ctx.save();
        ctx.translate(160 + i * 40 + triangleOffset, 90);
        ctx.beginPath();
        ctx.moveTo(-triangleSize/2, triangleSize/2);
        ctx.lineTo(triangleSize/2, triangleSize/2);
        ctx.lineTo(0, -triangleSize/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  };

  const drawTargetingReticle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 50) => {
    const centerX = x * ctx.canvas.width;
    const centerY = y * ctx.canvas.height;
    const time = Date.now() / 1000;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Dancing outer elements
    const segments = 4;
    for (let i = 0; i < segments; i++) {
      ctx.save();
      const rotationSpeed = 2 + Math.sin(time + i) * 0.5;
      const segmentPhase = time * rotationSpeed + i * Math.PI / 2;
      ctx.rotate(segmentPhase);
      
      // Dancing segment arc
      const arcSize = size * 1.5 * (1 + Math.sin(time * 3 + i) * 0.2);
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(time * 4 + i) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, arcSize, -Math.PI/4, Math.PI/4);
      ctx.stroke();

      // Dancing energy nodes
      const nodeCount = 3;
      for (let j = 0; j < nodeCount; j++) {
        const nodePhase = time * 5 + i + j;
        const nodeAngle = (j / (nodeCount - 1)) * Math.PI/2 - Math.PI/4;
        const nodeDistance = arcSize * (1 + Math.sin(nodePhase * 0.5) * 0.1);
        const nodeX = Math.cos(nodeAngle) * nodeDistance;
        const nodeY = Math.sin(nodeAngle) * nodeDistance;
        const nodeSize = 3 + Math.sin(nodePhase) * 2;

        ctx.fillStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(nodePhase) * 0.2})`;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Add node trails
        const trailCount = 3;
        for (let t = 1; t <= trailCount; t++) {
          const trailPhase = nodePhase - t * 0.2;
          const trailDistance = nodeDistance * (1 - t * 0.1);
          const trailX = Math.cos(nodeAngle - t * 0.1) * trailDistance;
          const trailY = Math.sin(nodeAngle - t * 0.1) * trailDistance;
          const trailSize = nodeSize * (1 - t/trailCount);
          
          ctx.fillStyle = `rgba(0, 255, 255, ${(0.6 + Math.sin(trailPhase) * 0.2) * (1 - t/trailCount)})`;
          ctx.beginPath();
          ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.restore();
    }

    // Dancing inner square
    const squareTime = time * -1;
    const squarePulse = 1 + Math.sin(time * 3) * 0.2;
    const squareSize = size * 0.8 * squarePulse;
    ctx.rotate(squareTime + Math.sin(time * 2) * 0.3);
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + Math.sin(time * 4) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-squareSize/2, -squareSize/2, squareSize, squareSize);

    // Dynamic crosshairs
    const crosshairSize = size * 1.2;
    const crosshairInner = size * 0.3;
    const crosshairPulse = Math.sin(time * 4) * 0.2 + 0.8;
    
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 * crosshairPulse})`;
    ctx.lineWidth = 2;
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(-crosshairSize, 0);
    ctx.lineTo(-crosshairInner, 0);
    ctx.moveTo(crosshairInner, 0);
    ctx.lineTo(crosshairSize, 0);
    ctx.stroke();

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(0, -crosshairSize);
    ctx.lineTo(0, -crosshairInner);
    ctx.moveTo(0, crosshairInner);
    ctx.lineTo(0, crosshairSize);
    ctx.stroke();

    // Energy field
    const fieldRadius = size * 1.2;
    const fieldSegments = 8;
    for (let i = 0; i < fieldSegments; i++) {
      const angle = (i / fieldSegments) * Math.PI * 2 + time;
      const gradient = ctx.createLinearGradient(
        Math.cos(angle) * fieldRadius,
        Math.sin(angle) * fieldRadius,
        0,
        0
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.5, `rgba(0, 255, 255, ${0.2 + Math.sin(time * 3 + i) * 0.1})`);
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(angle) * fieldRadius,
        Math.sin(angle) * fieldRadius
      );
      ctx.stroke();
    }

    ctx.restore();

    // Target info display with enhanced cyber effect
    const text = `TRACKING: ${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%`;
    const glitchOffset = Math.sin(time * 10) > 0.95 ? Math.random() * 4 - 2 : 0;
    
    ctx.font = 'bold 14px monospace';
    const textWidth = ctx.measureText(text).width;
    
    // Animated background with energy pulse
    const bgPulse = (Math.sin(time * 6) + 1) / 2;
    const bgGradient = ctx.createLinearGradient(
      centerX - textWidth/2 - 10,
      centerY + size + 10,
      centerX + textWidth/2 + 10,
      centerY + size + 35
    );
    bgGradient.addColorStop(0, `rgba(0, 20, 40, ${0.8 + bgPulse * 0.2})`);
    bgGradient.addColorStop(0.5, `rgba(0, 30, 60, ${0.8 + bgPulse * 0.2})`);
    bgGradient.addColorStop(1, `rgba(0, 20, 40, ${0.8 + bgPulse * 0.2})`);
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(
      centerX - textWidth/2 - 10,
      centerY + size + 10,
      textWidth + 20,
      25
    );
    
    // Text with cyber effect
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText(text, centerX + glitchOffset, centerY + size + 27);

    // Glitch effect
    if (Math.random() > 0.95) {
      ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
      ctx.fillText(text, centerX + 2, centerY + size + 27);
    }
  };

  const predictWithCocoSsd = async (video: HTMLVideoElement) => {
    if (!cocoModel) return null;
    const predictions = await cocoModel.detect(video);
    
    // Enhanced ball detection - look for more ball-like objects
    const ballPredictions = predictions.filter(p => {
      const className = p.class.toLowerCase();
      // Expanded list of ball-like objects
      const ballTerms = [
        'ball', 'sphere', 'sports ball',
        'tennis', 'baseball', 'basketball', 'football', 'soccer',
        'circle', 'round', 'toy', 'orange', // orange might be similar to the ball color
      ];
      
      // Check if any of our ball terms match
      const isBallLike = ballTerms.some(term => className.includes(term));
      
      // Lower the confidence threshold to catch more potential balls
      // Only require 30% confidence instead of default higher threshold
      return isBallLike && p.score > 0.3;
    });
    
    // Log what we're finding for debugging
    console.log('All detections:', predictions);
    console.log('Ball predictions:', ballPredictions);

    // Store all detections for display
    setDetectedObjects(predictions);

    if (ballPredictions.length > 0) {
      return ballPredictions.map(ball => ({
        x: (ball.bbox[0] + ball.bbox[2]/2) / video.clientWidth,
        y: (ball.bbox[1] + ball.bbox[3]/2) / video.clientHeight,
        confidence: ball.score,
        type: ball.class
      }));
    }

    // If no explicit balls found, look for circular/round objects based on aspect ratio
    const roundObjects = predictions.filter(p => {
      const width = p.bbox[2];
      const height = p.bbox[3];
      const aspectRatio = width / height;
      // If the object is roughly square (like a ball would be), consider it
      return aspectRatio > 0.8 && aspectRatio < 1.2 && p.score > 0.3;
    });

    if (roundObjects.length > 0) {
      return roundObjects.map(obj => ({
        x: (obj.bbox[0] + obj.bbox[2]/2) / video.clientWidth,
        y: (obj.bbox[1] + obj.bbox[3]/2) / video.clientHeight,
        confidence: obj.score,
        type: 'round object'
      }));
    }

    return null;
  };

  const startPredicting = () => {
    const predict = async () => {
      if (videoRef.current && isWebcamActive && canvasRef.current) {
        try {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          drawSimpleHUD(ctx);

          let predictions = [];
          if (modelType === 'custom') {
            const pred = await predictImage(videoRef.current);
            predictions = pred ? [{ ...pred, confidence: 1, type: 'trained ball' }] : [];
          } else if (modelType === 'coco-ssd') {
            predictions = await predictWithCocoSsd(videoRef.current) || [];
          }

          if (predictions.length > 0) {
            setIsTracking(true);
            predictions.forEach(pred => {
              drawSimpleReticle(ctx, pred.x, pred.y, pred.confidence, pred.type);
              playPingSound();
            });
          } else {
            setIsTracking(false);
          }

        } catch (err) {
          console.error('Prediction error:', err);
          setIsTracking(false);
        }
        animationFrameRef.current = requestAnimationFrame(predict);
      }
    };
    predict();
  };

  // Simple ping sound when ball is detected
  const playPingSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const drawSimpleHUD = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Simple scanning overlay
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Animated scanning grid
    const time = Date.now() / 1000;
    const gridSize = 50;
    const offset = (time * 50) % gridSize;
    
    // Vertical lines
    for (let x = -offset; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = -offset; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Status text with all detections
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    
    ctx.fillText(
      `STATUS: ${isTracking ? 'TRACKING' : 'SCANNING...'}`, 
      20, 
      30
    );

    // Show all detected objects
    if (detectedObjects.length > 0) {
      ctx.font = '14px monospace';
      detectedObjects.forEach((obj, i) => {
        const y = 60 + (i * 20);
        ctx.fillText(
          `${obj.class} (${(obj.score * 100).toFixed(0)}%)`,
          20,
          y
        );
      });
    }
  };

  const drawSimpleReticle = (ctx: CanvasRenderingContext2D, x: number, y: number, confidence: number = 1, type: string = 'ball') => {
    const centerX = x * ctx.canvas.width;
    const centerY = y * ctx.canvas.height;
    const size = 40;

    ctx.save();
    
    // Confidence-based color
    const alpha = 0.3 + (confidence * 0.7); // Higher confidence = more solid
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
    
    // Targeting circle with fill
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Animated pulse ring
    const pulseSize = size + (Math.sin(Date.now() / 200) * 10);
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
    ctx.stroke();

    // Crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();

    // Object info text
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(`${type.toUpperCase()} (${(confidence * 100).toFixed(0)}%)`, centerX, centerY - size - 10);

    ctx.restore();
  };

  // Load saved models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await modelManager.listModels();
        setSavedModels(models);
        if (models.length > 0) {
          setSelectedModelId(models[0].id);
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };
    loadModels();
  }, []);

  // Switch model when selection changes
  useEffect(() => {
    if (selectedModelId) {
      const switchToModel = async () => {
        try {
          setIsModelLoading(true);
          await modelManager.switchModel(selectedModelId);
          setHasCustomModel(true);
          setModelType('custom');
        } catch (err) {
          console.error('Failed to switch model:', err);
          setError('Failed to switch model');
        } finally {
          setIsModelLoading(false);
        }
      };
      switchToModel();
    }
  }, [selectedModelId]);

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingModel(true);
    try {
      const modelFile = files[0];
      const weightsFile = files.length > 1 ? files[1] : null;
      
      const modelName = prompt('Enter a name for this model:', modelFile.name) || modelFile.name;
      const description = prompt('Enter a description (optional):') || '';

      const newModel = await modelManager.uploadModel(
        modelFile,
        weightsFile,
        modelName,
        description
      );

      setSavedModels(prev => [...prev, newModel]);
      setSelectedModelId(newModel.id);
      setHasCustomModel(true);
      setModelType('custom');
    } catch (err) {
      console.error('Failed to upload model:', err);
      setError('Failed to upload model: ' + err.message);
    } finally {
      setIsUploadingModel(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      await modelManager.deleteModel(modelId);
      setSavedModels(prev => prev.filter(m => m.id !== modelId));
      if (selectedModelId === modelId) {
        const remaining = savedModels.filter(m => m.id !== modelId);
        setSelectedModelId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete model:', err);
      setError('Failed to delete model');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Test Model with Webcam</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Show Trail</label>
            <input
              type="checkbox"
              checked={showTrail}
              onChange={(e) => setShowTrail(e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Models</h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleModelUpload}
              accept=".json"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingModel}
              className="base-button"
            >
              {isUploadingModel ? 'Uploading...' : 'Upload Model'}
            </button>
          </div>

          <div className="grid gap-4">
            {savedModels.length === 0 ? (
              <p className="text-gray-400 text-sm">No models available. Upload one or train a new model.</p>
            ) : (
              savedModels.map(model => (
                <div
                  key={model.id}
                  className={`bg-gray-900/50 rounded-lg p-3 ${
                    selectedModelId === model.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{model.name}</h4>
                      <p className="text-sm text-gray-400">
                        {model.type === 'custom' ? 'Trained' : 'Uploaded'} on{' '}
                        {new Date(model.createdAt).toLocaleDateString()}
                      </p>
                      {model.description && (
                        <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedModelId(model.id)}
                        className={`base-button ${
                          selectedModelId === model.id ? 'bg-blue-600' : ''
                        }`}
                      >
                        {selectedModelId === model.id ? 'Active' : 'Use'}
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {!hasCustomModel && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-500 font-bold mb-2">No Trained Model Found</h3>
            <p className="text-yellow-400 text-sm">
              For accurate stick-ball tracking, you need to:
            </p>
            <ol className="list-decimal list-inside text-yellow-400 text-sm mt-2 space-y-1">
              <li>Capture training data with your stick</li>
              <li>Label the ball positions</li>
              <li>Train a custom model</li>
            </ol>
            <p className="text-yellow-400 text-sm mt-2">
              The general object detection (COCO-SSD) can detect basic objects but won't be specialized for your needs.
            </p>
          </div>
        )}

        <div className="flex gap-4 items-center justify-between bg-gray-800/50 p-4 rounded-lg">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Detection Model:</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as ModelType)}
              disabled={isModelLoading || isWebcamActive}
              className="bg-gray-900 text-white rounded px-3 py-1 text-sm border border-gray-700"
            >
              <option value="custom" disabled={!hasCustomModel}>
                Custom Ball Tracker {!hasCustomModel && '(Not Found)'}
              </option>
              <option value="coco-ssd">General Object Detection (COCO-SSD)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Mode:</label>
            <select
              value={detectionMode}
              onChange={(e) => setDetectionMode(e.target.value as DetectionMode)}
              disabled={isModelLoading || isWebcamActive}
              className="bg-gray-900 text-white rounded px-3 py-1 text-sm border border-gray-700"
            >
              <option value="ball-tracking">Ball Tracking</option>
              <option value="object-detection">Object Detection</option>
            </select>
          </div>
        </div>
        
        {isModelLoading ? (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400">Loading model...</p>
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ 
                  mixBlendMode: 'screen',
                  filter: 'contrast(1.1) brightness(1.1)'
                }}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                {!isWebcamActive ? (
                  <button onClick={startWebcam} className="base-button">
                    Start Webcam
                  </button>
                ) : (
                  <button onClick={stopWebcam} className="base-button">
                    Stop Webcam
                  </button>
                )}
              </div>

              {detectedObjects.length > 0 && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">Detected Objects:</h3>
                  <ul className="space-y-1">
                    {detectedObjects.map((obj, i) => (
                      <li key={i} className="text-sm text-gray-400">
                        {obj.class} ({(obj.score * 100).toFixed(1)}% confidence)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 