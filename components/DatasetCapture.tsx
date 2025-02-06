'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './DatasetCapture.css';

interface DatasetCaptureProps {
  onStatusChange: (status: 'idle' | 'recording' | 'processing') => void;
  onSaveComplete: () => void;
}

// Constants
const BBOX_SIZE = 0.08;
const MAX_FRAMES = 100;
const RECORDING_INTERVAL = 100;
const MIN_BALL_DISTANCE = 0.1;

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

type LabelingMode = 'ball1' | 'ball2' | 'review';

export default function DatasetCapture({ onStatusChange, onSaveComplete }: DatasetCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [labels, setLabels] = useState<Array<FrameLabels>>([]);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [labelingMode, setLabelingMode] = useState<LabelingMode>('ball1');
  const recordingInterval = useRef<NodeJS.Timeout>();
  const frames = useRef<string[]>([]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
    frameRate: 30,
    aspectRatio: 16/9
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
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
    setCurrentFrame(0);
    setLabelingMode('ball1');

    recordingInterval.current = setInterval(() => {
      const screenshot = webcamRef.current?.getScreenshot();
      if (screenshot) {
        frames.current.push(screenshot);
        
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
    setLabels(new Array(frames.current.length).fill({}));
  };

  const validateBallPosition = (x: number, y: number, existingBall?: Annotation): boolean => {
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      setError('Ball position must be within image bounds');
      return false;
    }

    if (existingBall) {
      const distance = Math.sqrt(
        Math.pow(x - existingBall.x, 2) + 
        Math.pow(y - existingBall.y, 2)
      );
      if (distance < MIN_BALL_DISTANCE) {
        setError('Balls must be further apart');
        return false;
      }
    }

    return true;
  };

  const handleFrameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      const img = e.currentTarget.querySelector('img');
      if (!img) {
        setError('Image element not found');
        return;
      }

      const imgRect = img.getBoundingClientRect();
      const x = (e.clientX - imgRect.left) / imgRect.width;
      const y = (e.clientY - imgRect.top) / imgRect.height;

      const annotation: Annotation = {
        x,
        y,
        width: BBOX_SIZE,
        height: BBOX_SIZE
      };

      setLabels(prev => {
        const newLabels = [...prev];
        if (!newLabels[currentFrame]) {
          newLabels[currentFrame] = {};
        }

        if (labelingMode === 'ball1') {
          if (validateBallPosition(x, y)) {
            newLabels[currentFrame].ball1 = annotation;
            setLabelingMode('ball2');
            setError(null);
          }
        } else if (labelingMode === 'ball2') {
          if (validateBallPosition(x, y, newLabels[currentFrame].ball1)) {
            newLabels[currentFrame].ball2 = annotation;
            setLabelingMode('review');
            setError(null);
          }
        }

        return newLabels;
      });
    } catch (err) {
      setError('Failed to process click');
      console.error('Click handling error:', err);
    }
  };

  const moveToNextFrame = () => {
    if (currentFrame < capturedFrames.length - 1) {
      setCurrentFrame(prev => prev + 1);
      setLabelingMode('ball1');
      setError(null);
    }
  };

  const moveToPreviousFrame = () => {
    if (currentFrame > 0) {
      setCurrentFrame(prev => prev - 1);
      setLabelingMode('ball1');
      setError(null);
    }
  };

  const resetCurrentFrame = () => {
    setLabels(prev => {
      const newLabels = [...prev];
      newLabels[currentFrame] = {};
      return newLabels;
    });
    setLabelingMode('ball1');
    setError(null);
  };

  const renderFrameControls = () => {
    if (!capturedFrames.length) return null;

    return (
      <div className="frame-controls glass-effect">
        <button
          onClick={moveToPreviousFrame}
          disabled={currentFrame === 0}
          className="control-button"
        >
          Previous Frame
        </button>
        
        <div className="frame-info">
          <span>Frame {currentFrame + 1} of {capturedFrames.length}</span>
          <span className="mode-indicator">
            {labelingMode === 'ball1' ? 'Place Ball 1' : 
             labelingMode === 'ball2' ? 'Place Ball 2' : 
             'Review Frame'}
          </span>
        </div>

        <button
          onClick={moveToNextFrame}
          disabled={currentFrame === capturedFrames.length - 1}
          className="control-button"
        >
          Next Frame
        </button>
      </div>
    );
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

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Dataset Capture</h2>
          {!isRecording && capturedFrames.length === 0 && (
            <button
              onClick={startRecording}
              className="base-button bg-blue-600 hover:bg-blue-700"
            >
              Start Recording (30s)
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}
        
        <div className="relative">
          {isRecording ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="webcam-preview rounded-lg border-2 border-gray-700"
            />
          ) : capturedFrames.length > 0 ? (
            <div 
              className="annotation-frame"
              onClick={handleFrameClick}
            >
              <img 
                src={capturedFrames[currentFrame]} 
                alt={`Frame ${currentFrame + 1}`}
                className="rounded-lg border-2 border-gray-700"
              />
              
              {labels[currentFrame]?.ball1 && (
                <div 
                  className="bounding-box ball1"
                  style={{
                    left: `${labels[currentFrame].ball1.x * 100}%`,
                    top: `${labels[currentFrame].ball1.y * 100}%`,
                    width: `${BBOX_SIZE * 100}%`,
                    height: `${BBOX_SIZE * 100}%`
                  }}
                >
                  <div className="box-label">Ball 1</div>
                </div>
              )}

              {labels[currentFrame]?.ball2 && (
                <div 
                  className="bounding-box ball2"
                  style={{
                    left: `${labels[currentFrame].ball2.x * 100}%`,
                    top: `${labels[currentFrame].ball2.y * 100}%`,
                    width: `${BBOX_SIZE * 100}%`,
                    height: `${BBOX_SIZE * 100}%`
                  }}
                >
                  <div className="box-label">Ball 2</div>
                </div>
              )}
            </div>
          ) : null}
          
          {isRecording && (
            <div className="absolute top-4 right-4 recording-indicator">
              <div className="pulsing-red-dot" />
              <span className="text-white bg-black/50 px-2 py-1 rounded">
                {countdown}s
              </span>
            </div>
          )}
        </div>

        {renderFrameControls()}

        {capturedFrames.length > 0 && labelingMode === 'review' && (
          <div className="frame-actions">
            <button
              onClick={resetCurrentFrame}
              className="base-button bg-red-600 hover:bg-red-700"
            >
              Reset Frame
            </button>
            <button
              onClick={moveToNextFrame}
              className="base-button bg-green-600 hover:bg-green-700"
            >
              Next Frame
            </button>
          </div>
        )}

        {capturedFrames.length > 0 && (
          <div className="progress-bar glass-effect">
            {capturedFrames.map((_, idx) => (
              <div
                key={idx}
                className={`progress-segment ${
                  idx === currentFrame ? 'current' : ''
                } ${
                  labels[idx]?.ball1 && labels[idx]?.ball2 ? 'complete' :
                  labels[idx]?.ball1 ? 'partial' : ''
                }`}
                onClick={() => {
                  setCurrentFrame(idx);
                  setLabelingMode(
                    !labels[idx]?.ball1 ? 'ball1' :
                    !labels[idx]?.ball2 ? 'ball2' : 'review'
                  );
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={saveDataset}
          disabled={!labels.every(frame => frame.ball1 && frame.ball2)}
          className="base-button bg-green-600 hover:bg-green-700 w-full disabled:bg-gray-600"
        >
          Save Dataset ({labels.filter(l => l?.ball1 && l?.ball2).length}/{capturedFrames.length} fully labeled)
        </button>
      </div>
    </div>
  );
} 