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
const DatasetCapture = dynamic(() => import('./DatasetCapture'), {
  loading: () => <div>Loading capture...</div>,
  ssr: false
});

const StickTracker = dynamic(() => import('./StickTracker'), {
  loading: () => <div>Loading tracker...</div>,
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl my-4 border border-white/10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('capture')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  activeTab === 'capture' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {MinimalIcons.training} Capture
              </button>
              <button
                onClick={() => setActiveTab('train')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  activeTab === 'train' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                disabled={!datasetInfo?.isValid}
              >
                {MinimalIcons.prediction} Train
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  activeTab === 'test' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {MinimalIcons.test} Test
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {MinimalIcons.close}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'capture' && (
            <DatasetCapture 
              onStatusChange={handleCaptureStatus}
              onSaveComplete={handleSaveComplete}
            />
          )}
          {activeTab === 'train' && datasetInfo?.isValid && (
            <div className="p-4 text-white/80">Model training coming soon</div>
          )}
          {activeTab === 'test' && (
            <StickTracker />
          )}

          {/* Dataset Status */}
          {datasetInfo && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/5 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-white/90 mb-3">Dataset Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Total Images</span>
                    <span className="text-white font-medium">{datasetInfo.stats.totalImages}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-gray-400">Total Labels</span>
                    <span className="text-white font-medium">{datasetInfo.stats.totalLabels}</span>
                  </div>
                </div>
                {datasetInfo.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-red-400">
                      {datasetInfo.errors.map((error, i) => (
                        <p key={i} className="text-sm">
                          {error.message}
                          {error.details && (
                            <span className="block text-xs text-red-500/70 mt-1">{error.details}</span>
                          )}
                        </p>
                      ))}
                    </div>
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