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
  x: number;
  y: number;
  isVisible: boolean;
  width: number;
  height: number;
  boundingPoints?: { x: number; y: number }[];
}

interface FrameLabel {
  orange: BallLabel | null;
  white: BallLabel | null;
}

export default function DatasetCapture({ onStatusChange, onSaveComplete }: DatasetCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [labels, setLabels] = useState<FrameLabel[]>([]);
  const [countdown, setCountdown] = useState(30);
  const recordingInterval = useRef<NodeJS.Timeout>();
  const frames = useRef<string[]>([]);
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string}>>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isAutoLabeling, setIsAutoLabeling] = useState(false);
  const [selectedBall, setSelectedBall] = useState<'orange' | 'white'>('orange');
  const [latestModel, setLatestModel] = useState<{id: string, name: string} | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment",
    frameRate: 30
  };

  useEffect(() => {
    onStatusChange(isRecording ? 'recording' : 'idle');
  }, [isRecording, onStatusChange]);

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      const models = await modelManager.listModels();
      setAvailableModels(models.map(m => ({ id: m.id, name: m.name })));
    };
    loadModels();
  }, []);

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

  const startRecording = () => {
    if (!webcamRef.current) return;
    setIsRecording(true);
    setCountdown(30);
    frames.current = [];

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
  };

  const generateBoundingPoints = (centerX: number, centerY: number, width: number, height: number): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const numPoints = 20;
    
    // Generate points in a perfect circle and then scale to ellipse if needed
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // Use precise trigonometry to place points
      const ellipseX = Math.cos(angle) * (width / 2);
      const ellipseY = Math.sin(angle) * (height / 2);
      
      // Ensure points stay within frame bounds
      const x = Math.max(0, Math.min(1, centerX + ellipseX));
      const y = Math.max(0, Math.min(1, centerY + ellipseY));
      
      points.push({ x, y });
    }
    return points;
  };

  const handleFrameClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent any default browser handling
    
    // Get the clicked image element for accurate coordinates
    const imgElement = e.currentTarget.querySelector('img');
    if (!imgElement) return;

    const rect = imgElement.getBoundingClientRect();
    
    // Calculate coordinates relative to the image, not the container
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const width = 0.025;  // 2.5% of frame width
    const height = 0.025; // 2.5% of frame height
    
    setLabels(prev => {
      const newLabels = [...prev];
      if (!newLabels[index]) {
        newLabels[index] = { orange: null, white: null };
      }
      
      const currentLabel = newLabels[index];
      
      // Check if clicking near existing points
      const isNearOrange = currentLabel?.orange && 
        Math.hypot(
          (x - currentLabel.orange.x) * rect.width,
          (y - currentLabel.orange.y) * rect.height
        ) < 20;

      const isNearWhite = currentLabel?.white && 
        Math.hypot(
          (x - currentLabel.white.x) * rect.width,
          (y - currentLabel.white.y) * rect.height
        ) < 20;

      // Create the new ball label
      const newBall = {
        x,
        y,
        width,
        height,
        isVisible: true
      };

      // Update based on proximity and current selection
      if (isNearOrange) {
        newLabels[index] = {
          ...currentLabel,
          orange: newBall
        };
      } else if (isNearWhite) {
        newLabels[index] = {
          ...currentLabel,
          white: newBall
        };
      } else {
        // Place new point based on selection
        if (selectedBall === 'orange' && !currentLabel?.orange) {
          newLabels[index] = {
            ...currentLabel,
            orange: newBall
          };
          // Auto-switch to white if it's not set yet
          if (!currentLabel?.white) {
            setSelectedBall('white');
          }
        } else if (selectedBall === 'white' && !currentLabel?.white) {
          newLabels[index] = {
            ...currentLabel,
            white: newBall
          };
          // Auto-switch to orange for next frame
          setSelectedBall('orange');
        }
      }
      
      return newLabels;
    });
  };

  // Add a function to clear a frame's labels
  const clearFrameLabels = (index: number) => {
    setLabels(prev => {
      const newLabels = [...prev];
      newLabels[index] = { orange: null, white: null };
      return newLabels;
    });
    setSelectedBall('orange'); // Reset selection to orange
  };

  const toggleBallVisibility = (frameIndex: number, ballType: 'orange' | 'white') => {
    setLabels(prev => {
      const newLabels = [...prev];
      const ball = newLabels[frameIndex]?.[ballType];
      if (ball) {
        ball.isVisible = !ball.isVisible;
      }
      return newLabels;
    });
  };

  // Auto-label function
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
      const [orangeX, orangeY, whiteX, whiteY] = await prediction.data();

      // Use the same ball dimensions as manual labeling
      const width = 0.025;
      const height = 0.025;

      setLabels(prev => {
        const newLabels = [...prev];
        newLabels[index] = {
          orange: { 
            x: orangeX, 
            y: orangeY, 
            isVisible: true,
            width,
            height,
            boundingPoints: generateBoundingPoints(orangeX, orangeY, width, height)
          },
          white: { 
            x: whiteX, 
            y: whiteY, 
            isVisible: true,
            width,
            height,
            boundingPoints: generateBoundingPoints(whiteX, whiteY, width, height)
          }
        };
        return newLabels;
      });

      tensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Auto-labeling error:', error);
    }
  };

  // Auto-label all frames
  const autoLabelAllFrames = async () => {
    if (!selectedModelId) return;

    setIsAutoLabeling(true);
    try {
      await modelManager.switchModel(selectedModelId);
      
      for (let i = 0; i < capturedFrames.length; i++) {
        await autoLabelFrame(capturedFrames[i], i);
      }
    } catch (error) {
      console.error('Auto-labeling failed:', error);
    } finally {
      setIsAutoLabeling(false);
    }
  };

  const removeBallLabel = (index: number, ballType: 'orange' | 'white') => {
    setLabels(prev => {
      const newLabels = [...prev];
      if (newLabels[index]) {
        newLabels[index] = {
          ...newLabels[index],
          [ballType]: null
        };
      }
      return newLabels;
    });
  };

  const saveDataset = async () => {
    try {
      onStatusChange('processing');
      setSaveSuccess('Saving dataset...');

      const timestamp = Date.now();
      const formData = new FormData();
      let savedCount = 0;
      
      capturedFrames.forEach((frame, index) => {
        const label = labels[index];
        // Skip if no label or if either ball is marked as not visible
        if (!label?.orange?.isVisible || !label?.white?.isVisible) return;

        const blob = dataURLtoBlob(frame);
        const filename = `frame_${timestamp}_${index.toString().padStart(4, '0')}`;
        
        // Save image
        formData.append('images', blob, `${filename}.jpg`);

        // Save both ball labels in a single file
        // Format: "class_id x y width height" (one ball per line)
        const labelContent = [
          `0 ${label.orange.x.toFixed(6)} ${label.orange.y.toFixed(6)} ${label.orange.width.toFixed(6)} ${label.orange.height.toFixed(6)}`,
          `1 ${label.white.x.toFixed(6)} ${label.white.y.toFixed(6)} ${label.white.width.toFixed(6)} ${label.white.height.toFixed(6)}`
        ].join('\n');

        formData.append('labels', 
          new Blob([labelContent], { type: 'text/plain' }), 
          `${filename}.txt`
        );
        
        savedCount++;
      });

      if (savedCount === 0) {
        throw new Error('No valid frames to save');
      }

      const response = await fetch('/api/dataset/save', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save dataset');
      }
      
      setSaveSuccess(`✅ Successfully saved ${savedCount} frames to dataset`);
      setCapturedFrames([]);
      setLabels([]);
      onSaveComplete();
      onStatusChange('idle');

      // Clear success message after 5 seconds
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveSuccess(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
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

  return (
    <div className="space-y-6 min-h-0">
      <div className="space-y-4">
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="webcam-preview rounded-lg border-2 border-gray-700 w-full"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {capturedFrames.map((frame, index) => {
                const frameLabel = labels[index];
                const isFullyLabeled = frameLabel?.orange?.isVisible && frameLabel?.white?.isVisible;
                const borderColor = isFullyLabeled ? 'border-green-500' : 'border-gray-700';
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="relative group">
                      <div 
                        className={`relative cursor-crosshair ${borderColor} border-2 rounded-lg transition-colors`}
                        onClick={(e) => handleFrameClick(index, e)}
                      >
                        <img 
                          src={frame} 
                          alt={`Frame ${index + 1}`}
                          className="rounded-lg w-full"
                        />
                        {frameLabel?.orange && (
                          <div
                            className="absolute w-4 h-4 bg-orange-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 transition-opacity"
                            style={{ 
                              left: `${frameLabel.orange.x * 100}%`,
                              top: `${frameLabel.orange.y * 100}%`,
                              opacity: frameLabel.orange.isVisible ? 1 : 0.5
                            }}
                          />
                        )}
                        {frameLabel?.white && (
                          <div
                            className="absolute w-4 h-4 bg-white rounded-full border-2 border-gray-700 transform -translate-x-1/2 -translate-y-1/2 transition-opacity"
                            style={{ 
                              left: `${frameLabel.white.x * 100}%`,
                              top: `${frameLabel.white.y * 100}%`,
                              opacity: frameLabel.white.isVisible ? 1 : 0.5
                            }}
                          />
                        )}
                        
                        {/* Status indicator */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                          <span className="text-sm font-medium px-2 py-1 rounded bg-black/50 text-white">
                            {isFullyLabeled ? '✓ Complete' : 
                             !frameLabel?.orange ? 'Click Orange Ball' :
                             !frameLabel?.white ? 'Click White Ball' : ''}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFrameLabels(index);
                            }}
                            className="text-sm px-2 py-1 rounded bg-red-500/50 hover:bg-red-500 text-white transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-4 space-y-2">
              <button
                onClick={saveDataset}
                disabled={!labels.some(label => 
                  label?.orange?.isVisible && label?.white?.isVisible
                )}
                className="base-button bg-green-600 hover:bg-green-700 w-full disabled:bg-gray-600 py-3 text-lg font-medium"
              >
                Save Dataset ({labels.filter(l => l?.orange?.isVisible && l?.white?.isVisible).length} frames)
              </button>
              
              {saveSuccess && (
                <div className={`text-center font-medium p-3 rounded ${
                  saveSuccess.includes('❌') ? 'bg-red-500/10 text-red-500' : 
                  saveSuccess.includes('✅') ? 'bg-green-500/10 text-green-500' : 
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {saveSuccess}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 