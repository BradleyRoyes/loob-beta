import React, { useState, useRef, useEffect } from 'react';

interface CapturePoint {
  x: number;
  y: number;
  timestamp: number;
  imageName: string;
}

export default function DatasetCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturePoint[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
        setErrorMessage(null);
      }
    } catch (error) {
      console.error('Webcam error:', error);
      setErrorMessage('Failed to access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopCapture = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    setSelectedPoint({ x, y });
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedPoint) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Draw the current video frame
    ctx.drawImage(
      videoRef.current,
      0, 0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Generate unique filename
    const timestamp = Date.now();
    const imageName = `frame_${timestamp}.jpg`;

    // Save the frame
    const imageBlob = await new Promise<Blob>((resolve) => {
      canvasRef.current?.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', 0.95);
    });

    // Create label data
    const capturePoint: CapturePoint = {
      x: selectedPoint.x,
      y: selectedPoint.y,
      timestamp,
      imageName
    };

    // Save image and update manifest
    await saveTrainingData(imageBlob, capturePoint);

    // Update UI
    setCapturedFrames(prev => [...prev, capturePoint]);
    setSelectedPoint(null);
  };

  const saveTrainingData = async (imageBlob: Blob, point: CapturePoint) => {
    try {
      // Create FormData with the image and label
      const formData = new FormData();
      formData.append('image', imageBlob, point.imageName);
      formData.append('label', JSON.stringify({
        x: point.x,
        y: point.y
      }));

      // Send to server endpoint
      const response = await fetch('/api/dataset/save', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to save training data');
      }

      console.log('Saved training data:', point);
    } catch (error) {
      console.error('Error saving training data:', error);
      setErrorMessage('Failed to save training data. Please try again.');
    }
  };

  const exportDataset = async () => {
    try {
      // Generate manifest
      const manifest = {
        images: capturedFrames.map(frame => frame.imageName),
        labels: capturedFrames.map(frame => frame.imageName.replace('.jpg', '.json'))
      };

      // Download manifest
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      const a = document.createElement('a');
      a.href = manifestUrl;
      a.download = 'manifest.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(manifestUrl);
    } catch (error) {
      console.error('Error exporting dataset:', error);
      setErrorMessage('Failed to export dataset');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Dataset Capture</h2>
        
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-300">
            Instructions:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
            <li>Start the webcam</li>
            <li>Click on the ball in each frame to set its position</li>
            <li>Click "Capture Frame" to save the labeled frame</li>
            <li>Repeat for multiple frames</li>
            <li>Click "Export Dataset" when done</li>
          </ol>
        </div>

        <div className="flex gap-4">
          <button
            onClick={isCapturing ? stopCapture : startCapture}
            className="base-button"
          >
            {isCapturing ? 'Stop Camera' : 'Start Camera'}
          </button>

          {isCapturing && (
            <>
              <button
                onClick={captureFrame}
                disabled={!selectedPoint}
                className="base-button"
              >
                Capture Frame
              </button>

              {capturedFrames.length > 0 && (
                <button
                  onClick={exportDataset}
                  className="base-button"
                >
                  Export Dataset
                </button>
              )}
            </>
          )}
        </div>

        {isCapturing && (
          <div className="relative inline-block">
            <video
              ref={videoRef}
              style={{ display: 'none' }}
              width="640"
              height="480"
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              onClick={handleCanvasClick}
              className="rounded-lg border border-gray-700 cursor-crosshair"
            />
            {selectedPoint && (
              <div 
                className="absolute w-4 h-4 border-2 border-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${selectedPoint.x * 100}%`,
                  top: `${selectedPoint.y * 100}%`
                }}
              />
            )}
          </div>
        )}

        {capturedFrames.length > 0 && (
          <div className="bg-gray-900/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Captured Frames: {capturedFrames.length}
            </h3>
            <div className="text-xs text-gray-400">
              Latest coordinates: ({capturedFrames[capturedFrames.length - 1].x.toFixed(3)}, 
              {capturedFrames[capturedFrames.length - 1].y.toFixed(3)})
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
} 