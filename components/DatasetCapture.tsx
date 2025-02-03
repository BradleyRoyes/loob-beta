'use client';
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

interface DatasetCaptureProps {
  onStatusChange: (status: 'idle' | 'recording' | 'processing') => void;
  onSaveComplete: () => void;
}

export default function DatasetCapture({ onStatusChange, onSaveComplete }: DatasetCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [labels, setLabels] = useState<Array<{x: number, y: number}>>([]);
  const [countdown, setCountdown] = useState(30);
  const recordingInterval = useRef<NodeJS.Timeout>();
  const frames = useRef<string[]>([]);

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

  const handleFrameClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setLabels(prev => {
      const newLabels = [...prev];
      newLabels[index] = { x, y };
      return newLabels;
    });
  };

  const saveDataset = async () => {
    try {
      onStatusChange('processing');
      const timestamp = Date.now();
      const formData = new FormData();
      
      capturedFrames.forEach((frame, index) => {
        if (!labels[index]) return;

        const blob = dataURLtoBlob(frame);
        const filename = `frame_${timestamp}_${index.toString().padStart(4, '0')}`;
        
        formData.append('images', blob, `${filename}.jpg`);
        
        const labelContent = `0 ${labels[index].x.toFixed(6)} ${labels[index].y.toFixed(6)} 0.05 0.05`;
        formData.append('labels', 
          new Blob([labelContent], { type: 'text/plain' }), 
          `${filename}.txt`
        );
      });

      const response = await fetch('/api/dataset/save', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to save dataset');
      
      setCapturedFrames([]);
      setLabels([]);
      onSaveComplete();
      onStatusChange('idle');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save dataset');
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
        <h2 className="text-xl font-bold">Dataset Capture</h2>
        
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
                    className="rounded-lg border-2 border-gray-700"
                  />
                  {labels[index] && (
                    <div
                      className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${labels[index].x * 100}%`,
                        top: `${labels[index].y * 100}%`
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveDataset}
              disabled={labels.filter(Boolean).length !== capturedFrames.length}
              className="base-button bg-green-600 hover:bg-green-700 w-full disabled:bg-gray-600"
            >
              Save Dataset ({labels.filter(Boolean).length}/{capturedFrames.length} labeled)
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 