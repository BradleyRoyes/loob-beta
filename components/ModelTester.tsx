'use client';

import React, { useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { modelManager } from '@/lib/model';

export default function ModelTester() {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [testImage, setTestImage] = useState<HTMLImageElement | null>(null);
  const [prediction, setPrediction] = useState<{x: number, y: number} | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('Upload a model to begin');

  const drawImageAndOverlay = (img: HTMLImageElement, pred?: {x: number, y: number}) => {
    // Draw original image
    const imageCanvas = imageCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!imageCanvas || !overlayCanvas) return;

    // Set both canvases to image dimensions
    imageCanvas.width = img.width;
    imageCanvas.height = img.height;
    overlayCanvas.width = img.width;
    overlayCanvas.height = img.height;

    // Draw image on bottom canvas
    const imgCtx = imageCanvas.getContext('2d');
    if (imgCtx) {
      imgCtx.drawImage(img, 0, 0);
    }

    // Clear and draw prediction on overlay canvas
    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx && pred) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      // Convert normalized coordinates to pixel coordinates
      const pixelX = pred.x * overlayCanvas.width;
      const pixelY = pred.y * overlayCanvas.height;

      // Draw large crosshair
      overlayCtx.strokeStyle = '#FF0000';
      overlayCtx.lineWidth = 3;
      const size = 20;

      // Draw crosshair
      overlayCtx.beginPath();
      overlayCtx.moveTo(pixelX - size, pixelY);
      overlayCtx.lineTo(pixelX + size, pixelY);
      overlayCtx.moveTo(pixelX, pixelY - size);
      overlayCtx.lineTo(pixelX, pixelY + size);
      overlayCtx.stroke();

      // Draw circle
      overlayCtx.beginPath();
      overlayCtx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
      overlayCtx.fillStyle = '#FF0000';
      overlayCtx.fill();

      // Draw coordinates with background
      overlayCtx.font = 'bold 16px monospace';
      const text = `(${pred.x.toFixed(3)}, ${pred.y.toFixed(3)})`;
      
      // Add background to text for better visibility
      const metrics = overlayCtx.measureText(text);
      const padding = 4;
      overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      overlayCtx.fillRect(
        pixelX + 15, 
        pixelY - 20, 
        metrics.width + padding * 2, 
        24
      );
      
      overlayCtx.fillStyle = '#FFFFFF';
      overlayCtx.fillText(text, pixelX + 15 + padding, pixelY);
    }
  };

  // Handle model upload
  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setStatus('Loading model...');
      
      const jsonFile = Array.from(files).find(f => f.name.endsWith('.json'));
      const weightsFile = Array.from(files).find(f => f.name.endsWith('.bin'));

      if (!jsonFile || !weightsFile) {
        throw new Error('Please select both model.json and weights.bin files');
      }

      await modelManager.uploadModel(jsonFile, weightsFile, 'Test Model');
      const loadedModel = await modelManager.getModel();
      
      // Verify model shape
      const inputShape = loadedModel.inputs[0].shape;
      if (inputShape[1] !== 224 || inputShape[2] !== 224) {
        throw new Error(`Invalid input shape: expected [null,224,224,3] but got [${inputShape}]`);
      }

      setModel(loadedModel);
      setStatus('Model loaded successfully. Upload an image to test.');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      console.error('Model upload error:', err);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setTestImage(img);
      setStatus('Image loaded. Click "Run Prediction" to test.');
      drawImageAndOverlay(img);  // Draw image without prediction
    };
    img.src = URL.createObjectURL(file);
  };

  // Run prediction
  const runPrediction = async () => {
    if (!model || !testImage) {
      setStatus('Please upload both model and image first');
      return;
    }

    try {
      setStatus('Running prediction...');
      
      // Preprocess image - now using 224x224 consistently
      const tensor = tf.tidy(() => {
        return tf.browser.fromPixels(testImage)
          .resizeNearestNeighbor([224, 224])
          .sub(tf.scalar(127.5))
          .div(tf.scalar(127.5))
          .expandDims(0);
      });

      // Run prediction
      const output = await model.predict(tensor) as tf.Tensor;
      const [x, y] = await output.data();
      const newPrediction = { x, y };
      setPrediction(newPrediction);

      // Update visualization
      drawImageAndOverlay(testImage, newPrediction);

      setStatus('Prediction complete');
      
      // Cleanup
      tensor.dispose();
      output.dispose();
    } catch (err) {
      setStatus(`Error during prediction: ${err.message}`);
      console.error('Prediction error:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold">Model Tester</h2>
      
      {/* Status Display */}
      <div className="bg-gray-900/50 p-4 rounded">
        <p className="text-sm text-cyan-400">{status}</p>
      </div>

      {/* Step 1: Model Upload */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Step 1: Upload Model</h3>
        <input
          type="file"
          accept=".json,.bin"
          multiple
          onChange={handleModelUpload}
          className="w-full"
        />
        <p className="text-xs text-gray-400">
          Select both model.json and weights.bin files
        </p>
      </div>

      {/* Step 2: Image Upload (only shown after model is loaded) */}
      {model && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Step 2: Upload Test Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full"
          />
        </div>
      )}

      {/* Step 3: Run Prediction (only shown after image is loaded) */}
      {model && testImage && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Step 3: Test Model</h3>
        <button
            onClick={runPrediction}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
            Run Prediction
        </button>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative mt-4 border border-gray-700 rounded">
        {/* Bottom canvas for image */}
        <canvas 
          ref={imageCanvasRef}
          className="w-full"
        />
        {/* Top canvas for overlay */}
        <canvas 
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full pointer-events-none"
        />
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="bg-gray-900/50 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Prediction Results</h3>
          <p className="font-mono">
            X: {prediction.x.toFixed(3)}<br/>
            Y: {prediction.y.toFixed(3)}
            </p>
          </div>
      )}
    </div>
  );
}
