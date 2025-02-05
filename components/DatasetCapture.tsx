'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
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
  const [isWebcamReady, setIsWebcamReady] = useState(false);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment",
    frameRate: 30
  };

  useEffect(() => {
    onStatusChange(isRecording ? 'recording' : 'idle');
  }, [isRecording, onStatusChange]);

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

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "environment",
          frameRate: 30
        }
      });
      
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
        setIsWebcamReady(true);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      onStatusChange('idle');
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
    }
  };

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="space-y-6 min-h-0">
      <div className="space-y-4">
        <div className="relative group">
          {!isWebcamReady ? (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <button
                onClick={startWebcam}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="webcam-preview"
              />
              
              {isRecording && (
                <div className="absolute top-4 right-4 recording-indicator">
                  <div className="pulsing-red-dot" />
                  <span className="text-white font-medium">
                    Recording: {countdown}s
                  </span>
                </div>
              )}

              {!isRecording && !capturedFrames.length && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                  >
                    Start Recording (30s)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {capturedFrames.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white/90">Captured Frames</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setCapturedFrames([]);
                    setLabels([]);
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={startRecording}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  Record More
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {capturedFrames.map((frame, index) => {
                const frameLabel = labels[index];
                const isFullyLabeled = frameLabel?.orange?.isVisible && frameLabel?.white?.isVisible;
                
                return (
                  <div key={index} className="frame-preview">
                    <div 
                      className="relative cursor-crosshair group"
                      onClick={(e) => handleFrameClick(index, e)}
                    >
                      <img 
                        src={frame} 
                        alt={`Frame ${index + 1}`}
                        className="w-full rounded-lg"
                      />
                      {frameLabel?.orange && (
                        <div
                          className="ball-marker orange"
                          style={{ 
                            left: `${frameLabel.orange.x * 100}%`,
                            top: `${frameLabel.orange.y * 100}%`,
                            opacity: frameLabel.orange.isVisible ? 1 : 0.5
                          }}
                        />
                      )}
                      {frameLabel?.white && (
                        <div
                          className="ball-marker white"
                          style={{ 
                            left: `${frameLabel.white.x * 100}%`,
                            top: `${frameLabel.white.y * 100}%`,
                            opacity: frameLabel.white.isVisible ? 1 : 0.5
                          }}
                        />
                      )}
                      
                      <div className="absolute inset-x-0 top-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                          isFullyLabeled ? 'bg-green-500/20 text-green-400' : 
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {isFullyLabeled ? '✓ Complete' : 
                           !frameLabel?.orange ? 'Click Orange Ball' :
                           !frameLabel?.white ? 'Click White Ball' : ''}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFrameLabels(index);
                          }}
                          className="text-sm px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-4 space-y-4 bg-gradient-to-t from-black/90 to-transparent p-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Total Frames: {capturedFrames.length}</span>
                <span>Labeled Frames: {labels.filter(l => l?.orange?.isVisible && l?.white?.isVisible).length}</span>
              </div>
              
              <button
                onClick={saveDataset}
                disabled={!labels.some(label => 
                  label?.orange?.isVisible && label?.white?.isVisible
                )}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all transform hover:-translate-y-0.5 ${
                  labels.some(l => l?.orange?.isVisible && l?.white?.isVisible)
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                Save Dataset
              </button>
            </div>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="success-toast">
          {saveSuccess}
        </div>
      )}
    </div>
  );
} 