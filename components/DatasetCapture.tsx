'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './DatasetCapture.css';

interface DatasetCaptureProps {
  onStatusChange: (status: 'idle' | 'recording' | 'processing') => void;
  onSaveComplete: () => void;
}

// Constants
const BBOX_SIZE = 0.05;
const MAX_FRAMES = 100; // Safety limit for memory
const RECORDING_INTERVAL = 300; // 300ms between frames

interface Annotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FrameLabels {
  ball1?: Annotation;
  ball2?: Annotation;
}

export default function DatasetCapture({ onStatusChange, onSaveComplete }: DatasetCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [labels, setLabels] = useState<Array<FrameLabels>>([]);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout>();
  const frames = useRef<string[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment",
    frameRate: 30
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      // Clear any stored frames
      frames.current = [];
      setCapturedFrames([]);
    };
  }, []);

  useEffect(() => {
    onStatusChange(isRecording ? 'recording' : 'idle');
  }, [isRecording, onStatusChange]);

  const startRecording = () => {
    if (!webcamRef.current) {
      setError('Camera not initialized');
      return;
    }
    
    setError(null);
    setIsRecording(true);
    setCountdown(30);
    frames.current = [];

    recordingInterval.current = setInterval(() => {
      const screenshot = webcamRef.current?.getScreenshot();
      if (screenshot) {
        frames.current.push(screenshot);
        
        // Safety check for memory
        if (frames.current.length >= MAX_FRAMES) {
          stopRecording();
          setError('Maximum frame limit reached');
          return;
        }
      }
      
      setCountdown(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, RECORDING_INTERVAL);
  };

  const stopRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    setIsRecording(false);
    setCapturedFrames(frames.current);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleFrameClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        setError('Invalid click position');
        return;
      }

      const boxSize = BBOX_SIZE;
      const annotation: Annotation = {
        x,
        y,
        width: boxSize,
        height: boxSize
      };
      
      setLabels(prev => {
        const newLabels = [...prev];
        if (!newLabels[index]) {
          newLabels[index] = {};
        }
        
        if (!newLabels[index].ball1) {
          newLabels[index].ball1 = annotation;
        } else if (!newLabels[index].ball2) {
          newLabels[index].ball2 = annotation;
        } else {
          newLabels[index] = { ball1: annotation };
        }
        
        return newLabels;
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to process click');
      console.error('Click handling error:', err);
    }
  };

  const saveDataset = async () => {
    try {
      onStatusChange('processing');
      const timestamp = Date.now();
      const formData = new FormData();
      let savedCount = 0;
      
      // Only save frames that have both balls labeled
      for (let index = 0; index < capturedFrames.length; index++) {
        const frame = capturedFrames[index];
        const frameLabels = labels[index];
        
        if (!frameLabels?.ball1 || !frameLabels?.ball2) continue;

        try {
          const blob = dataURLtoBlob(frame);
          const filename = `frame_${timestamp}_${index.toString().padStart(4, '0')}`;
          
          formData.append('images', blob, `${filename}.jpg`);
          
          // Create YOLO format labels for both balls
          const labelContent = 
            `0 ${frameLabels.ball1.x.toFixed(6)} ${frameLabels.ball1.y.toFixed(6)} ${BBOX_SIZE} ${BBOX_SIZE}\n` +
            `0 ${frameLabels.ball2.x.toFixed(6)} ${frameLabels.ball2.y.toFixed(6)} ${BBOX_SIZE} ${BBOX_SIZE}`;
          
          formData.append('labels', 
            new Blob([labelContent], { type: 'text/plain' }), 
            `${filename}.txt`
          );
          
          savedCount++;
        } catch (err) {
          console.error(`Failed to process frame ${index}:`, err);
          continue; // Skip this frame but continue with others
        }
      }

      if (savedCount === 0) {
        throw new Error('No valid frames to save');
      }

      const response = await fetch('/api/dataset/save', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save dataset');
      }
      
      // Clear memory
      frames.current = [];
      setCapturedFrames([]);
      setLabels([]);
      setError(null);
      onSaveComplete();
      onStatusChange('idle');
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save dataset');
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

  // Helper function to calculate bounding box dimensions
  const getBoundingBoxStyle = (x: number, y: number) => {
    const size = BBOX_SIZE * 100; // Convert to percentage
    return {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      width: `${size}%`,
      height: `${size}%`
    };
  };

  const getFrameStatus = (index: number) => {
    const frameLabels = labels[index];
    if (!frameLabels) return 'unlabeled';
    if (frameLabels.ball1 && frameLabels.ball2) return 'complete';
    if (frameLabels.ball1 || frameLabels.ball2) return 'partial';
    return 'unlabeled';
  };

  const getLabelingGuideText = (index: number) => {
    const frameLabels = labels[index];
    if (!frameLabels || (!frameLabels.ball1 && !frameLabels.ball2)) {
      return 'Click to place Ball 1 (Red)';
    }
    if (frameLabels.ball1 && !frameLabels.ball2) {
      return 'Click to place Ball 2 (Blue)';
    }
    return 'Click again to relabel';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Dataset Capture</h2>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Unlabeled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Partially Labeled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Fully Labeled</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}
        
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
          <div className="annotation-grid">
            {capturedFrames.map((frame, index) => {
              const status = getFrameStatus(index);
              return (
                <div 
                  key={index}
                  className="annotation-frame"
                  onClick={(e) => handleFrameClick(index, e)}
                  onMouseMove={handleMouseMove}
                >
                  <img 
                    src={frame} 
                    alt={`Frame ${index + 1}`}
                  />
                  
                  <div 
                    className="annotation-overlay"
                    style={{
                      '--x': `${mousePos.x}%`,
                      '--y': `${mousePos.y}%`
                    } as React.CSSProperties}
                  >
                    <div className={`frame-status ${status}`}>
                      {status === 'unlabeled' && 'Click to Label'}
                      {status === 'partial' && 'Need Ball 2'}
                      {status === 'complete' && 'Complete'}
                    </div>

                    <div className="annotation-instructions">
                      {!labels[index]?.ball1 && 'Click to place Ball 1'}
                      {labels[index]?.ball1 && !labels[index]?.ball2 && 'Click to place Ball 2'}
                      {labels[index]?.ball1 && labels[index]?.ball2 && 'Click to reset'}
                    </div>

                    {labels[index]?.ball1 && (
                      <>
                        <div 
                          className="bounding-box ball1"
                          style={{
                            left: `${labels[index].ball1.x * 100}%`,
                            top: `${labels[index].ball1.y * 100}%`
                          }}
                        >
                          <div className="box-label ball1">Ball 1</div>
                        </div>
                      </>
                    )}

                    {labels[index]?.ball2 && (
                      <>
                        <div 
                          className="bounding-box ball2"
                          style={{
                            left: `${labels[index].ball2.x * 100}%`,
                            top: `${labels[index].ball2.y * 100}%`
                          }}
                        >
                          <div className="box-label ball2">Ball 2</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={saveDataset}
          disabled={!capturedFrames.every((_, i) => labels[i]?.ball1 && labels[i]?.ball2)}
          className="base-button bg-green-600 hover:bg-green-700 w-full disabled:bg-gray-600"
        >
          Save Dataset ({labels.filter(l => l?.ball1 && l?.ball2).length}/{capturedFrames.length} fully labeled)
        </button>
      </div>
    </div>
  );
} 