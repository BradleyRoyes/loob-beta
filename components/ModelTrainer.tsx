'use client';

import React, { useState, useEffect } from 'react';
import { trainModel, modelManager } from '@/lib/model';

export default function ModelTrainer() {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'initializing' | 'training' | 'success' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        await modelManager.clearCache();
        setTrainingStatus('idle');
      } catch (error) {
        console.error('Initialization failed:', error);
        setErrorMessage('Failed to initialize TensorFlow. Please try refreshing the page.');
        setTrainingStatus('error');
      }
    };
    init();
  }, []);

  const handleTrain = async () => {
    try {
      setTrainingStatus('training');
      setErrorMessage(null);
      setProgress(0);

      await trainModel((progress) => {
        setProgress(progress);
      });

      setTrainingStatus('success');
    } catch (error) {
      console.error('Training failed:', error);
      setErrorMessage(error.message);
      setTrainingStatus('error');
    }
  };

  if (trainingStatus === 'initializing') {
    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400">Initializing TensorFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Model Training</h2>
        
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-300">
            Before training, ensure you have:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Extracted frames to /public/dataset/images/</li>
            <li>Created label files in /public/dataset/labels/</li>
            <li>Created a manifest.json file listing your images and labels</li>
            <li>Each label file contains normalized coordinates (0-1)</li>
          </ul>
        </div>

        <button
          onClick={handleTrain}
          disabled={trainingStatus === 'training'}
          className="base-button w-full"
        >
          {trainingStatus === 'training' ? 'Training in Progress...' :
           trainingStatus === 'success' ? 'Retrain Model' : 'Start Training'}
        </button>

        {/* Training Progress */}
        {trainingStatus === 'training' && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold inline-block text-blue-300">
                  Training Progress
                </span>
                <span className="text-xs font-semibold inline-block text-blue-300">
                  {progress.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-700">
                <div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {trainingStatus === 'success' && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 space-y-4">
            <p className="text-green-400">✓ Model trained successfully!</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={async () => {
                  const model = await modelManager.getModel();
                  await model.save('downloads://loobricate-model');
                }}
                className="base-button"
              >
                Download Model
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {trainingStatus === 'error' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-2">
            <p className="text-red-400">✕ Training failed</p>
            {errorMessage && (
              <div className="text-sm text-red-300 font-mono whitespace-pre-wrap">
                {errorMessage}
              </div>
            )}
            <p className="text-sm text-red-300">
              Please check the console for detailed error logs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 