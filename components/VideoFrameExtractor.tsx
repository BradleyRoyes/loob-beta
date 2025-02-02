'use client';

import React, { useState, useRef } from 'react';
import './VideoFrameExtractor.css';

const VideoFrameExtractor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const extractFrames = async (file: File) => {
    setIsProcessing(true);
    setFrames([]);
    setProgress(0);

    const video = videoRef.current!;
    const url = URL.createObjectURL(file);
    video.src = url;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(true);
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const frameRate = 30; // Assume standard frame rate or calculate from video metadata
    const frameCount = Math.floor(video.duration * frameRate);
    const extractedFrames: string[] = [];

    video.currentTime = 0;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    for (let i = 0; i < frameCount; i += 3) { // Extract every 3rd frame
      try {
        await new Promise((resolve) => {
          video.currentTime = i / frameRate;
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0);
            extractedFrames.push(canvas.toDataURL('image/jpeg', 0.8));
            setProgress((i / frameCount) * 100);
            resolve(true);
          };
        });
      } catch (error) {
        console.error('Error extracting frame:', error);
      }
    }

    setFrames(extractedFrames);
    setIsProcessing(false);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      extractFrames(file);
    }
  };

  const downloadFrames = () => {
    frames.forEach((frame, index) => {
      const link = document.createElement('a');
      link.href = frame;
      link.download = `frame_${index}.jpg`;
      link.click();
    });
  };

  return (
    <div className="video-frame-extractor">
      <video ref={videoRef} style={{ display: 'none' }} />
      
      <div className="upload-section">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          disabled={isProcessing}
          id="video-upload"
        />
        <label htmlFor="video-upload" className="upload-button">
          {isProcessing ? 'Processing...' : 'Upload Video'}
        </label>
      </div>

      {isProcessing && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span>{Math.round(progress)}%</span>
        </div>
      )}

      {frames.length > 0 && (
        <div className="results-section">
          <h3>Extracted Frames: {frames.length}</h3>
          <button 
            className="download-button"
            onClick={downloadFrames}
          >
            Download All Frames
          </button>
          
          <div className="frames-preview">
            {frames.slice(0, 9).map((frame, index) => (
              <img 
                key={index}
                src={frame}
                alt={`Frame ${index}`}
                className="frame-preview"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFrameExtractor; 