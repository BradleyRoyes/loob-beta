'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { modelManager } from '@/lib/model';

export default function ModelPredictor() {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await modelManager.getModel();
        setModel(loadedModel);
      } catch (error) {
        console.error('Failed to load model:', error);
      }
    };
    loadModel();

    return () => {
      // Clean up model when component unmounts
      modelManager.disposeModel();
    };
  }, []);

  const handleLoadModel = async (files: FileList | null) => {
    if (!files || files.length < 2) {
      setErrorMessage('Please select both model.json and .bin files');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage(null);

      // Find the model.json file
      const jsonFile = Array.from(files).find(file => file.name.endsWith('.json'));
      if (!jsonFile) {
        throw new Error('model.json file not found');
      }

      // Create a URL for the model files
      const modelUrl = URL.createObjectURL(jsonFile);
      
      // Load the model
      const loadedModel = await tf.loadLayersModel(modelUrl);
      setModel(loadedModel);
      setStatus('ready');
      
      // Clean up the URL
      URL.revokeObjectURL(modelUrl);
    } catch (error) {
      console.error('Error loading model:', error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  const handlePredict = async (image: HTMLImageElement) => {
    if (!model) return null;

    try {
      // Preprocess image
      const tensor = tf.browser.fromPixels(image)
        .resizeBilinear([128, 128]) // Match training input size
        .expandDims(0)
        .div(255.0);

      // Make prediction
      const prediction = await model.predict(tensor) as tf.Tensor;
      const coordinates = await prediction.data();

      // Cleanup
      tensor.dispose();
      prediction.dispose();

      return {
        x: coordinates[0],
        y: coordinates[1]
      };
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Model Predictor</h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Load your trained model:
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleLoadModel(e.target.files)}
          multiple
          accept=".json,.bin"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            file:cursor-pointer"
        />
      </div>

      {status === 'ready' && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
          <p>✅ Model loaded successfully!</p>
          <p className="text-sm mt-2">
            The model is ready for predictions. You can now use it to track stick positions in images.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md space-y-2">
          <p className="font-bold">❌ Model loading failed</p>
          {errorMessage && (
            <div className="text-sm whitespace-pre-wrap font-mono">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {status === 'loading' && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-md">
          <p>Loading model...</p>
        </div>
      )}
    </div>
  );
}
