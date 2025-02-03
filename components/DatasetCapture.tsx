'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { modelManager } from '@/lib/model';
import * as tf from '@tensorflow/tfjs';

interface DatasetCaptureProps {
  onStatusChange: (status: 'idle' | 'recording' | 'processing') => void;
  onSaveComplete: () => void;
}

interface BallLabel {
  orange?: { x: number; y: number; width: number; height: number };
  white?: { x: number; y: number; width: number; height: number };
}

export default function DatasetCapture({ onStatusChange, onSaveComplete }: DatasetCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [labels, setLabels] = useState<BallLabel[]>([]);
  const [countdown, setCountdown] = useState(30);
  const [selectedBall, setSelectedBall] = useState<'orange' | 'white'>('orange');
  const [latestModel, setLatestModel] = useState<{id: string, name: string} | null>(null);
  const [isAutoLabeling, setIsAutoLabeling] = useState(false);
  const recordingInterval = useRef<NodeJS.Timeout>();
  const frames = useRef<string[]>([]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment",
    frameRate: 30
  };

  // Load latest model
  useEffect(() => {
    const loadLatestModel = async () => {
      const models = await modelManager.listModels();
      if (models.length > 0) {
        // Get the most recently created model
        const latest = models.reduce((latest, current) => 
          current.createdAt > latest.createdAt ? current : latest
        );
        setLatestModel({ id: latest.id, name: latest.name });
      }
    };
    loadLatestModel();
  }, []);

  useEffect(() => {
    onStatusChange(isRecording ? 'recording' : 'idle');
  }, [isRecording, onStatusChange]);

  const startRecording = () => {
    if (!webcamRef.current) return;
    setIsRecording(true);
    setCountdown(30);
    frames.current = [];
    setLabels([]);

    recordingInterval.current = setInterval(() => {
      const screenshot = webcamRef.current?.getScreenshot();
      if (screenshot) {
        frames.current.push(screenshot);
      }
      setCountdown(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 300);
  };

  const stopRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    setIsRecording(false);
    setCapturedFrames(frames.current);
    // Initialize empty labels for each frame
    setLabels(frames.current.map(() => ({})));
  };

  const handleFrameClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Default bounding box size (can be adjusted based on your needs)
    const width = 0.1;  // 10% of frame width
    const height = 0.1; // 10% of frame height
    
    setLabels(prev => {
      const newLabels = [...prev];
      newLabels[index] = {
        ...newLabels[index],
        [selectedBall]: { x, y, width, height }
      };
      return newLabels;
    });

    // Automatically switch to the other ball if it hasn't been labeled yet
    const currentLabel = labels[index];
    if (selectedBall === 'orange' && !currentLabel?.white) {
      setSelectedBall('white');
    } else if (selectedBall === 'white' && !currentLabel?.orange) {
      setSelectedBall('orange');
    }
  };

  const autoLabelFrame = async (frameDataUrl: string, index: number) => {
    try {
      const img = new Image();
      img.src = frameDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const model = await modelManager.getModel();
      const tensor = tf.tidy(() => {
        return tf.browser.fromPixels(img)
          .resizeBilinear([128, 128])
          .expandDims(0)
          .toFloat()
          .div(255.0);
      });

      const prediction = model.predict(tensor) as tf.Tensor;
      // Model should output [orange_x, orange_y, orange_w, orange_h, white_x, white_y, white_w, white_h]
      const [orangeX, orangeY, orangeW, orangeH, whiteX, whiteY, whiteW, whiteH] = await prediction.data();

      setLabels(prev => {
        const newLabels = [...prev];
        newLabels[index] = {
          orange: { x: orangeX, y: orangeY, width: orangeW, height: orangeH },
          white: { x: whiteX, y: whiteY, width: whiteW, height: whiteH }
        };
        return newLabels;
      });

      tensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Auto-labeling error:', error);
    }
  };

  const autoLabelAllFrames = async () => {
    if (!latestModel) return;

    setIsAutoLabeling(true);
    try {
      await modelManager.switchModel(latestModel.id);
      
      for (let i = 0; i < capturedFrames.length; i++) {
        await autoLabelFrame(capturedFrames[i], i);
      }
    } catch (error) {
      console.error('Auto-labeling failed:', error);
    } finally {
      setIsAutoLabeling(false);
    }
  };

  const saveDataset = async () => {
    try {
      onStatusChange('processing');

      // Validate dataset structure first
      const validateResponse = await fetch('/api/dataset/validate');
      const validation = await validateResponse.json();
      
      if (!validation.isValid) {
        const initResponse = await fetch('/api/dataset/save', {
          method: 'POST',
          body: new FormData()
        });
        
        if (!initResponse.ok) {
          throw new Error('Failed to initialize dataset directories');
        }
      }

      const timestamp = Date.now();
      const formData = new FormData();
      
      capturedFrames.forEach((frame, index) => {
        const label = labels[index];
        if (!label?.orange || !label?.white) return;

        const blob = dataURLtoBlob(frame);
        const filename = `frame_${timestamp}_${index.toString().padStart(4, '0')}`;
        
        formData.append('images', blob, `${filename}.jpg`);
        
        // YOLO format: class x y width height
        const orangeLabel = `0 ${label.orange.x.toFixed(6)} ${label.orange.y.toFixed(6)} ${label.orange.width.toFixed(6)} ${label.orange.height.toFixed(6)}\n`;
        const whiteLabel = `1 ${label.white.x.toFixed(6)} ${label.white.y.toFixed(6)} ${label.white.width.toFixed(6)} ${label.white.height.toFixed(6)}`;
        formData.append('labels', 
          new Blob([orangeLabel + whiteLabel], { type: 'text/plain' }), 
          `${filename}.txt`
        );
      });

      const response = await fetch('/api/dataset/save', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save dataset');
      }
      
      setCapturedFrames([]);
      setLabels([]);
      onSaveComplete();
      onStatusChange('idle');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save dataset: ${error.message}`);
      onStatusChange('idle');
    }
  };

  const dataURLtoBlob = (dataURL: string) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  };

  const isFrameFullyLabeled = (label: BallLabel): boolean => {
    return !!label?.orange && !!label?.white;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Dataset Capture</h2>
          {latestModel && (
            <button
              onClick={autoLabelAllFrames}
              disabled={isAutoLabeling || capturedFrames.length === 0}
              className="base-button bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
            >
              {isAutoLabeling ? 'Auto-labeling...' : 'Auto-label with Latest Model'}
            </button>
          )}
        </div>
        
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="webcam-preview rounded-lg border-2 border-gray-700"
          />
          
          {isRecording && (
            <div className="absolute top-4 right-4 recording-indicator">
              <div className="pulsing-red-dot" />
              <span className="text-white bg-black/50 px-2 py-1 rounded">
                {countdown}s
              </span>
            </div>
          )}
        </div>

        {!isRecording && capturedFrames.length === 0 && (
          <button
            onClick={startRecording}
            className="base-button bg-blue-600 hover:bg-blue-700 w-full"
          >
            Start Recording (30s)
          </button>
        )}

        {capturedFrames.length > 0 && (
          <div className="space-y-4">
            {/* Manual Labeling Controls */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Manual Labeling</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBall('orange')}
                  className={`flex-1 base-button ${
                    selectedBall === 'orange' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  Orange Ball
                </button>
                <button
                  onClick={() => setSelectedBall('white')}
                  className={`flex-1 base-button ${
                    selectedBall === 'white' 
                      ? 'bg-gray-100 hover:bg-gray-200 text-black' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  White Ball
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Click on each ball's center in the frames below. The bounding box will be automatically sized.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {capturedFrames.map((frame, index) => (
                <div 
                  key={index}
                  className="relative cursor-crosshair"
                  onClick={(e) => handleFrameClick(index, e)}
                >
                  <img 
                    src={frame} 
                    alt={`Frame ${index + 1}`}
                    className={`rounded-lg border-2 ${
                      isFrameFullyLabeled(labels[index]) 
                        ? 'border-green-500' 
                        : 'border-gray-700'
                    }`}
                  />
                  {labels[index]?.orange && (
                    <div
                      className="absolute bg-orange-500/30 border-2 border-orange-500"
                      style={{ 
                        left: `${(labels[index].orange.x - labels[index].orange.width/2) * 100}%`,
                        top: `${(labels[index].orange.y - labels[index].orange.height/2) * 100}%`,
                        width: `${labels[index].orange.width * 100}%`,
                        height: `${labels[index].orange.height * 100}%`
                      }}
                    />
                  )}
                  {labels[index]?.white && (
                    <div
                      className="absolute bg-white/30 border-2 border-white"
                      style={{ 
                        left: `${(labels[index].white.x - labels[index].white.width/2) * 100}%`,
                        top: `${(labels[index].white.y - labels[index].white.height/2) * 100}%`,
                        width: `${labels[index].white.width * 100}%`,
                        height: `${labels[index].white.height * 100}%`
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveDataset}
              disabled={!labels.every(isFrameFullyLabeled)}
              className="base-button bg-green-600 hover:bg-green-700 w-full disabled:bg-gray-600"
            >
              Save Dataset ({labels.filter(isFrameFullyLabeled).length}/{capturedFrames.length} fully labeled)
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 