'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useModelManager } from './ModelManager';
import { ModelSelector } from './detection/ModelSelector';
import { Prediction } from '@/types/detection';
import * as tf from '@tensorflow/tfjs';
import { modelManager } from '@/lib/model';

export default function ModelTester() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [debugInfo, setDebugInfo] = useState<{
    status: string;
    model: string;
    fps: number;
    lastDetection: string;
    inferenceTime: number;
    modelLoadTime?: number;
    frameSize: string;
    error?: string | null;
  }>({
    status: 'Initializing',
    model: 'none',
    fps: 0,
    lastDetection: 'none',
    inferenceTime: 0,
    frameSize: '0x0'
  });

  // Use our model manager hook. We start with "custom" by default.
  const { activeModel, setActiveModel, handlers, isLoading } = useModelManager('custom');
  
  // FPS measurement
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);

  // Add confidence threshold state
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.3);

  // Add these new states at the top of the component
  const [rawModelOutput, setRawModelOutput] = useState<any>(null);
  const [preprocessedImage, setPreprocessedImage] = useState<{
    inputShape: number[],
    inputRange: [number, number]
  }>({ inputShape: [], inputRange: [0, 0] });

  // Add new state for static image testing
  const [staticImage, setStaticImage] = useState<HTMLImageElement | null>(null);
  const [isStaticMode, setIsStaticMode] = useState(false);

  // Draw bounding boxes and labels onto the canvas.
  const drawDetections = (ctx: CanvasRenderingContext2D, predictions: Prediction[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    predictions.forEach(pred => {
      // For custom model, we only get x,y coordinates
      const x = pred.x * ctx.canvas.width;  // Convert from normalized (0-1) to pixel coordinates
      const y = pred.y * ctx.canvas.height;
      
      // Draw target point
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw crosshair
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      const crosshairSize = 20;
      
      ctx.beginPath();
      ctx.moveTo(x - crosshairSize, y);
      ctx.lineTo(x + crosshairSize, y);
      ctx.moveTo(x, y - crosshairSize);
      ctx.lineTo(x, y + crosshairSize);
      ctx.stroke();

      // Draw coordinates text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.fillText(`(${x.toFixed(1)}, ${y.toFixed(1)})`, x + 10, y + 10);
    });
  };

  // Add this helper function
  const preprocessFrame = async (video: HTMLVideoElement) => {
    if (!video) return null;
    
    return tf.tidy(() => {
      // Match the exact preprocessing from training
      const tensor = tf.browser.fromPixels(video)
        .resizeBilinear([MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]])
        .toFloat()
        .div(255.0)
        .expandDims(0);
      
      // Log the preprocessing details
      setPreprocessedImage({
        inputShape: tensor.shape,
        inputRange: [0, 1] // We know it's normalized to 0-1
      });
      
      return tensor;
    });
  };

  // Modify the processFrame function to ensure continuous drawing
  const processFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !handlers?.[activeModel]) return;

    try {
      // Schedule next frame first to ensure smooth animation
      if (isWebcamActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }

      const startTime = performance.now();
      const newPredictions = await handlers[activeModel].detect(video);
      const endTime = performance.now();
      
      // Update FPS
      const fps = Math.round(1000 / (endTime - lastFrameTime.current));
      
      // Update state and draw in one batch
      setPredictions(newPredictions);
      setDebugInfo(prev => ({
        ...prev,
        status: 'Running',
        model: activeModel,
        fps,
        inferenceTime: endTime - startTime,
        frameSize: `${video.videoWidth}x${video.videoHeight}`,
        lastDetection: JSON.stringify(newPredictions[0]?.coordinates || 'none')
      }));

      // Always draw frame
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawDetections(ctx, newPredictions);
      }

      setPredictions(newPredictions);
      lastFrameTime.current = endTime;
      frameCount.current++;

    } catch (error) {
      console.error('Frame processing error:', error);
      setDebugInfo(prev => ({
        ...prev,
        status: 'Error',
        error: error.message
      }));
    }
  };

  // Start the webcam stream.
  const startWebcam = async () => {
    try {
      // Stop any existing stream first
      stopWebcam();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
              resolve(true);
            };
          }
        });

        // Start playing the video
        await videoRef.current.play();
        
        setIsWebcamActive(true);
        // Start processing frames
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
        
        console.log('Webcam started successfully');
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setDebugInfo(prev => ({
        ...prev,
        status: 'Error',
        error: `Failed to start webcam: ${err instanceof Error ? err.message : String(err)}`
      }));
    }
  };

  // Stop the webcam stream and cancel the processing loop.
  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  // Restart frame processing when active model changes.
  useEffect(() => {
    console.log('Active model changed to:', activeModel);
    if (isWebcamActive) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [activeModel]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopWebcam();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Update the handleModelUpload function
  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setDebugInfo(prev => ({ 
        ...prev, 
        status: 'Loading model...',
        error: null 
      }));

      // Check for required files
      const jsonFile = Array.from(files).find(f => f.name.endsWith('.json'));
      const weightsFile = Array.from(files).find(f => f.name.endsWith('.bin'));

      if (!jsonFile || !weightsFile) {
        throw new Error('Please select both model.json and weights.bin files');
      }

      // Load model through modelManager instead of directly
      await modelManager.uploadModel(jsonFile, weightsFile, 'Custom Model');
      const model = await modelManager.getModel();

      // Log model details
      const modelInfo = {
        inputShape: model.inputs[0].shape,
        outputShape: model.outputs[0].shape,
        layers: model.layers.length
      };
      console.log('Model loaded:', modelInfo);

      // Update state
      setActiveModel('custom');
      setDebugInfo(prev => ({ 
        ...prev, 
        status: 'Active',
        model: 'custom',
        error: null,
        lastDetection: `Model ready: ${modelInfo.inputShape.join('x')} → ${modelInfo.outputShape.join('x')}`
      }));

    } catch (err) {
      console.error('Model upload error:', err);
      setDebugInfo(prev => ({
        ...prev,
        status: 'Error',
        model: 'none',
        error: err instanceof Error ? err.message : 'Failed to load model'
      }));
    }
  };

  // Add handler for static image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      setStaticImage(img);
      setIsStaticMode(true);
      stopWebcam(); // Stop webcam if running
      
      // Run detection on static image
      if (handlers?.[activeModel]) {
        try {
          const predictions = await handlers[activeModel].detect(img);
          setPredictions(predictions);
          
          // Update canvas size and draw
          if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              drawDetections(ctx, predictions);
            }
          }
        } catch (err) {
          console.error('Static image detection error:', err);
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-center text-cyan-400 mb-4">
        Real-Time Object Tracker
      </h2>

      {/* Enhanced debug info panel */}
      <div className="bg-black/50 p-2 mb-4 rounded font-mono text-xs space-y-1 text-white">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={
            debugInfo.status === 'Error' ? 'text-red-400' : 
            debugInfo.status === 'Active' ? 'text-green-400' : 
            'text-yellow-400'
          }>
            {debugInfo.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Model:</span>
          <span>{debugInfo.model}</span>
        </div>
        <div className="flex justify-between">
          <span>FPS:</span>
          <span>{debugInfo.fps}</span>
        </div>
        <div className="flex justify-between">
          <span>Inference Time:</span>
          <span>{debugInfo.inferenceTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Frame Size:</span>
          <span>{debugInfo.frameSize}</span>
        </div>
        <div className="flex justify-between">
          <span>Detections:</span>
          <span className="text-right">{debugInfo.lastDetection}</span>
        </div>
        {debugInfo.error && (
          <div className="text-red-400 mt-2">
            Error: {debugInfo.error}
          </div>
        )}
      </div>

      {/* Add confidence threshold slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={confidenceThreshold * 100}
          onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Add mode selection */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setIsStaticMode(false)}
          className={`flex-1 px-4 py-2 rounded ${!isStaticMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Live Video
        </button>
        <button
          onClick={() => {
            setIsStaticMode(true);
            stopWebcam();
          }}
          className={`flex-1 px-4 py-2 rounded ${isStaticMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Static Image
        </button>
      </div>

      {/* Static image upload */}
      {isStaticMode && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Test Image Upload
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Upload an image to test detection
          </p>
        </div>
      )}

      {/* Video/Image display */}
      <div className="relative mb-4">
        {isStaticMode ? (
          staticImage && (
            <>
              <img
                src={staticImage.src}
                alt="Test"
                className="w-full"
              />
              <canvas 
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </>
          )
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
              onLoadedMetadata={(e) => {
                if (canvasRef.current) {
                  canvasRef.current.width = e.currentTarget.videoWidth;
                  canvasRef.current.height = e.currentTarget.videoHeight;
                }
              }}
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
          </>
        )}
      </div>

      {/* Show webcam controls only in live mode */}
      {!isStaticMode && (
        <button
          onClick={isWebcamActive ? stopWebcam : startWebcam}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          {isWebcamActive ? 'Stop Camera' : 'Start Camera'}
        </button>
      )}

      <div className="space-y-4">
        <ModelSelector
          models={[
            { 
              id: 'custom', 
              name: 'Target Tracker', 
              description: 'Custom coordinate prediction model', 
              isAvailable: true 
            }
          ]}
          activeModel={activeModel}
          onSelect={setActiveModel}
          isLoading={isLoading}
        />

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Custom Model Upload</h3>
          <div className="space-y-2">
            <input
              type="file"
              accept=".json,.bin"
              multiple
              onChange={handleModelUpload}
              className="w-full text-sm"
            />
            <p className="text-xs text-gray-400">
              Required files:
              <br />- model.json (model architecture)
              <br />- weights.bin (model weights)
            </p>
            {debugInfo.status === 'Success' && (
              <div className="text-green-400 text-sm mt-2">
                ✓ Model loaded successfully
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add this to the debug info panel */}
      {activeModel === 'custom' && (
        <>
          <div className="mt-4 border-t pt-2">
            <h3 className="font-bold mb-2">Model Debug Info:</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Input Shape:</span>
                <span>{preprocessedImage.inputShape.join('x')}</span>
              </div>
              <div className="flex justify-between">
                <span>Input Range:</span>
                <span>
                  [{preprocessedImage.inputRange[0].toFixed(2)}, 
                   {preprocessedImage.inputRange[1].toFixed(2)}]
                </span>
              </div>
              {rawModelOutput && (
                <>
                  <div className="flex justify-between">
                    <span>Output Shape:</span>
                    <span>{rawModelOutput.shape?.join('x')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Range:</span>
                    <span>
                      [{rawModelOutput.min?.().dataSync()[0].toFixed(4)}, 
                       {rawModelOutput.max?.().dataSync()[0].toFixed(4)}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Mean:</span>
                    <span>
                      {tf.mean(rawModelOutput).dataSync()[0].toFixed(4)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-2 text-xs">
            <p className="text-yellow-400">
              Training Tips:
              - Ensure input matches training data format
              - Check if predictions are reasonable
              - Monitor raw output distribution
            </p>
          </div>
        </>
      )}
    </div>
  );
}
