'use client';

import React, { useState } from 'react';
import { trainModel, modelManager, MODEL_CONFIG } from '@/lib/model';
import * as tf from '@tensorflow/tfjs';

interface TrainingDetails {
  currentEpoch: number;
  totalEpochs: number;
  batchesComplete: number;
  totalBatches: number;
  currentLoss: number | null;
  bestLoss: number | null;
  timeElapsed: number;
  estimatedTimeRemaining: number | null;
  currentLearningRate: number;
  gpuMemoryUsage: number;
  dataThroughput: number;
}

interface TrainingMetrics {
  loss: number[];
  val_loss: number[];
}

export default function ModelTrainer() {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'initializing' | 'training' | 'success' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [metrics, setMetrics] = useState<TrainingMetrics>({ loss: [], val_loss: [] });
  const [trainingDetails, setTrainingDetails] = useState<TrainingDetails>({
    currentEpoch: 0,
    totalEpochs: MODEL_CONFIG.epochs,
    batchesComplete: 0,
    totalBatches: 0,
    currentLoss: null,
    bestLoss: null,
    timeElapsed: 0,
    estimatedTimeRemaining: null,
    currentLearningRate: MODEL_CONFIG.learningRate,
    gpuMemoryUsage: 0,
    dataThroughput: 0
  });

  const handleTrain = async () => {
    setTrainingStatus('training');
    setProgress(0);
    setMetrics({ loss: [], val_loss: [] });
    const startTime = Date.now();
    let lastUpdate = 0;

    try {
      await trainModel(
        (progress) => setProgress(progress),
        {
          onBatchEnd: async (batch, logs) => {
            const now = Date.now();
            const timeElapsed = (now - startTime) / 1000;
            
            // Throttle updates to 60fps
            if (now - lastUpdate > 16) {
              setTrainingDetails(prev => {
                const batchesComplete = prev.batchesComplete + 1;
                const batchesPerSecond = batchesComplete / timeElapsed;
                const dataThroughput = batchesPerSecond * MODEL_CONFIG.batchSize;
                
                // Calculate memory usage from tf.memory()
                const gpuMemory = (tf.memory() as any).numBytesInGPU || 0;
                
                return {
                  ...prev,
                  batchesComplete,
                  currentLoss: logs.loss,
                  bestLoss: prev.bestLoss === null ? logs.loss : Math.min(prev.bestLoss, logs.loss),
                  timeElapsed,
                  estimatedTimeRemaining: (MODEL_CONFIG.epochs * prev.totalBatches - batchesComplete) / batchesPerSecond,
                  currentLearningRate: logs.lr || MODEL_CONFIG.learningRate,
                  gpuMemoryUsage: gpuMemory / 1024 / 1024, // MB
                  dataThroughput: Number(dataThroughput.toFixed(1))
                };
              });
              lastUpdate = now;
            }
          },
          onEpochBegin: async (epoch, logs) => {
            setTrainingDetails(prev => ({
              ...prev,
              currentEpoch: epoch + 1,
              totalBatches: logs.totalBatches || prev.totalBatches
            }));
          },
          onEpochEnd: async (epoch, logs) => {
            setMetrics(prev => ({
              loss: [...prev.loss, logs.loss],
              val_loss: [...prev.val_loss, logs.val_loss]
            }));
            
            // Update progress display
            const progress = ((epoch + 1) / MODEL_CONFIG.epochs) * 100;
            setProgress(progress);
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

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Model Training</h2>
        
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-300">Model Configuration:</p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Input Shape: {MODEL_CONFIG.inputShape.join(' × ')}</li>
            <li>Batch Size: {MODEL_CONFIG.batchSize}</li>
            <li>Epochs: {MODEL_CONFIG.epochs}</li>
            <li>Learning Rate: {MODEL_CONFIG.learningRate}</li>
          </ul>
        </div>

        <button
          onClick={handleTrain}
          disabled={trainingStatus === 'training'}
          className="base-button w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800"
        >
          {trainingStatus === 'training' ? 'Training in Progress...' :
           trainingStatus === 'success' ? 'Retrain Model' : 'Start Training'}
        </button>

        {/* Training Progress */}
        {trainingStatus === 'training' && (
          <div className="space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold">Training Progress</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p>Epoch: {trainingDetails.currentEpoch}/{trainingDetails.totalEpochs}</p>
                  <p>Loss: {trainingDetails.currentLoss?.toFixed(6) ?? 'N/A'}</p>
                </div>
                <div>
                  <p>Time: {Math.round(trainingDetails.timeElapsed)}s</p>
                  <p>ETA: {Math.round(trainingDetails.estimatedTimeRemaining ?? 0)}s</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {trainingStatus === 'success' && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400">✓ Model trained successfully!</p>
            <div className="mt-4">
              <button
                onClick={async () => {
                  const model = await modelManager.getModel();
                  await model.save('downloads://stick-detector-model');
                }}
                className="base-button bg-green-600 hover:bg-green-700"
              >
                Download Model
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {trainingStatus === 'error' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">✕ Training failed</p>
            {errorMessage && (
              <p className="text-sm text-red-300 mt-2">{errorMessage}</p>
            )}
          </div>
        )}

        {/* Training Metrics */}
        {metrics.loss.length > 0 && (
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Latest Metrics</h3>
            <div className="text-xs space-y-1">
              <div>Loss: {metrics.loss[metrics.loss.length - 1].toFixed(6)}</div>
              <div>Validation Loss: {metrics.val_loss[metrics.val_loss.length - 1].toFixed(6)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 