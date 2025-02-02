import { useRef, useEffect } from 'react';

interface WebcamProps {
  onFrame: (video: HTMLVideoElement) => void;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const WebcamCapture = ({ onFrame, isActive, onStart, onStop }: WebcamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number>();

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        onStart();
      }
    } catch (err) {
      console.error('Webcam error:', err);
    }
  };

  const stopCapture = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      onStop();
    }
  };

  useEffect(() => {
    return () => stopCapture();
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg bg-black"
      />
      {!isActive && (
        <button 
          onClick={startCapture}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          Start Camera
        </button>
      )}
    </div>
  );
}; 