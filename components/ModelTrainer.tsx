'use client';

import React, { useState, useEffect } from 'react';
import { trainModel, modelManager } from '@/lib/model';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

export default function ModelTrainer() {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'initializing' | 'training' | 'success' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [maxX, setMaxX] = useState<number>(0);
  const [minX, setMinX] = useState<number>(1);
  const [maxY, setMaxY] = useState<number>(0);
  const [minY, setMinY] = useState<number>(1);
  const [metrics, setMetrics] = useState<{loss: number[], val_loss: number[]}>({
    loss: [],
    val_loss: []
  });

  // Initialize TensorFlow.js
  useEffect(() => {
    const initTF = async () => {
      try {
        // Wait for TF to be ready
        await tf.ready();
        // Try to set backend to WebGL
        if (tf.findBackend('webgl')) {
          await tf.setBackend('webgl');
        }
        await modelManager.clearCache();
        setTrainingStatus('idle');
      } catch (error) {
        console.error('TensorFlow initialization failed:', error);
        setErrorMessage('Failed to initialize TensorFlow. Please try refreshing the page.');
        setTrainingStatus('error');
      }
    };
    
    initTF();
  }, []);

  const handleTrain = async () => {
    try {
      setTrainingStatus('training');
      setErrorMessage(null);
      setProgress(0);
      setMetrics({ loss: [], val_loss: [] });

      // Set up tfvis surface
      const surface = { name: 'Training Metrics', tab: 'Training' };
      
      await trainModel(
        (progress) => setProgress(progress),
        'Trained Model',
        'Training run with improved architecture',
        {
          onEpochEnd: async (epoch, logs) => {
            setMetrics(prev => ({
              loss: [...prev.loss, logs.loss],
              val_loss: [...prev.val_loss, logs.val_loss]
            }));

            // Plot metrics
            tfvis.show.history(surface, {
              values: [{
                x: epoch,
                y: logs.loss,
                series: 'loss'
              }, {
                x: epoch,
                y: logs.val_loss,
                series: 'val_loss'
              }]
            });
          }
        }
      );

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
                  try {
                    const model = await modelManager.getModel();
                    if (!model) {
                      throw new Error('No model available to download');
                    }
                    // Save model architecture and weights
                    await model.save('downloads://loobricate-model');
                    // This will trigger two downloads:
                    // 1. model.json (architecture)
                    // 2. weights.bin (weights)
                  } catch (error) {
                    console.error('Failed to download model:', error);
                    setErrorMessage('Failed to download model: ' + error.message);
                    setTrainingStatus('error');
                  }
                }}
                className="base-button"
              >
                Download Model (JSON + Weights)
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

        {/* Data Distribution */}
        {trainingStatus === 'success' && (
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Data Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-2 rounded">
                <p className="text-xs text-gray-400">X Coordinates</p>
                <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 rounded" 
                     style={{ width: `${(maxX - minX) * 100}%`, marginLeft: `${minX * 100}%` }} />
              </div>
              <div className="bg-black/20 p-2 rounded">
                <p className="text-xs text-gray-400">Y Coordinates</p>
                <div className="h-24 bg-gradient-to-b from-green-500 to-yellow-500 opacity-20 rounded" 
                     style={{ height: `${(maxY - minY) * 100}%`, marginTop: `${minY * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Training Metrics */}
        {metrics.loss.length > 0 && (
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Training Progress</h3>
            <div className="text-xs space-y-1">
              <div>Latest Loss: {metrics.loss[metrics.loss.length - 1].toFixed(6)}</div>
              <div>Latest Val Loss: {metrics.val_loss[metrics.val_loss.length - 1].toFixed(6)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 