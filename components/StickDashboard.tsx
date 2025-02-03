'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import './StickDashboard.css';

interface StickDashboardProps {
  onClose: () => void;
}

interface DatasetStats {
  totalImages: number;
  totalLabels: number;
  imageResolutions: string[];
  averageFileSize: number;
}

interface ValidationResult {
  isValid: boolean;
  stats: DatasetStats;
  errors: ValidationError[];
}

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  details?: string;
  code?: string;
}

const MinimalIcons = {
  training: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  ),
  prediction: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  ),
  test: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
};

type Tab = 'capture' | 'train' | 'test';

// Dynamically import components
const ModelTrainer = dynamic(() => import('./ModelTrainer'), {
  loading: () => <div>Loading trainer...</div>,
  ssr: false
});

const DatasetCapture = dynamic(() => import('./DatasetCapture'), {
  loading: () => <div>Loading capture...</div>,
  ssr: false
});

const ModelTester = dynamic(() => import('./WebcamDetector'), {
  loading: () => <div>Loading detector...</div>,
  ssr: false
});

const StickDashboard: React.FC<StickDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('capture');
  const [datasetInfo, setDatasetInfo] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'recording' | 'processing'>('idle');

  const checkDataset = async () => {
    try {
      console.log('Checking dataset in public/dataset...');
      const response = await fetch('/api/dataset/validate');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Dataset validation:', data);
      setDatasetInfo(data);
    } catch (error) {
      console.error('Dataset validation error:', error);
      setDatasetInfo({
        isValid: false,
        stats: {
          totalImages: 0,
          totalLabels: 0,
          imageResolutions: [],
          averageFileSize: 0
        },
        errors: [{
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
          code: 'VALIDATION_ERROR'
        }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDataset();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleCaptureStatus = (status: 'idle' | 'recording' | 'processing') => {
    setCaptureStatus(status);
    if (status === 'idle') {
      checkDataset();
    }
  };

  const handleSaveComplete = () => {
    checkDataset();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl my-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('capture')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'capture' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {MinimalIcons.training} Capture
              </button>
              <button
                onClick={() => setActiveTab('train')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'train' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                disabled={!datasetInfo?.isValid}
              >
                {MinimalIcons.prediction} Train
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'test' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {MinimalIcons.test} Test
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {MinimalIcons.close}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {activeTab === 'capture' && (
            <DatasetCapture 
              onStatusChange={handleCaptureStatus}
              onSaveComplete={handleSaveComplete}
            />
          )}
          {activeTab === 'train' && datasetInfo?.isValid && (
            <ModelTrainer />
          )}
          {activeTab === 'test' && (
            <ModelTester />
          )}

          {/* Dataset Status */}
          {datasetInfo && (
            <div className="mt-4 p-4 rounded-lg bg-gray-800/50">
              <h3 className="text-sm font-semibold mb-2">Dataset Status</h3>
              <div className="space-y-1 text-sm">
                <p>Total Images: {datasetInfo.stats.totalImages}</p>
                <p>Total Labels: {datasetInfo.stats.totalLabels}</p>
                {datasetInfo.errors.length > 0 && (
                  <div className="text-red-400 mt-2">
                    {datasetInfo.errors.map((error, i) => (
                      <p key={i}>
                        {error.message}
                        {error.details && `: ${error.details}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickDashboard; 