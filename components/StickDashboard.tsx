'use client';

import React, { useState, useEffect } from 'react';
import { ValidationResult } from '@/types/dataset';
import dynamic from 'next/dynamic';
import './StickDashboard.css';

interface StickDashboardProps {
  onClose: () => void;
}

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  details?: any;
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

// Dynamically import components to avoid circular dependencies
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

export default function StickDashboard({ onClose }: StickDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('capture');
  const [datasetInfo, setDatasetInfo] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'recording' | 'processing'>('idle');

  const checkDataset = async () => {
    try {
      console.log('Fetching dataset validation...');
      const response = await fetch('/api/dataset/validate');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Validation response:', data);
      setDatasetInfo(data);
    } catch (error) {
      console.error('Dataset validation error:', error);
      const safeError = error instanceof Error ? error : new Error(String(error));
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
          message: safeError.message,
          code: 'FETCH_ERROR'
        }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Use in useEffect
  useEffect(() => {
    checkDataset();
  }, []);

  // Handle ESC key to close
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

  // Add status callback for DatasetCapture
  const handleCaptureStatus = (status: 'idle' | 'recording' | 'processing') => {
    setCaptureStatus(status);
  };

  const renderDebugInfo = () => {
    if (!datasetInfo?.debug) return null;
    
    return (
      <div className="debug-info">
        <h4>Debug Information</h4>
        {datasetInfo.debug.paths && (
          <div className="debug-section">
            <h5>Paths:</h5>
            <pre>{JSON.stringify(datasetInfo.debug.paths, null, 2)}</pre>
          </div>
        )}
        {datasetInfo.debug.dirExists && (
          <div className="debug-section">
            <h5>Directory Status:</h5>
            <pre>{JSON.stringify(datasetInfo.debug.dirExists, null, 2)}</pre>
          </div>
        )}
        {datasetInfo.debug.error && (
          <div className="debug-section">
            <h5>Error Details:</h5>
            <pre className="error">{JSON.stringify(datasetInfo.debug.error, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="stick-dashboard-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="stick-dashboard glass-effect">
        <div className="dashboard-header">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
              Stick Tracking System
            </h2>
            <div className="px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/10 to-orange-400/10 border border-pink-500/20">
              <span className="text-xs text-pink-400">Beta</span>
            </div>
          </div>
          <button 
            className="close-button hover-lift"
            onClick={onClose}
            aria-label="Close"
          >
            {MinimalIcons.close}
          </button>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-button hover-lift ${activeTab === 'capture' ? 'active' : ''}`}
            onClick={() => setActiveTab('capture')}
          >
            {MinimalIcons.training}
            <span>Capture</span>
          </button>
          <button 
            className={`tab-button hover-lift ${activeTab === 'train' ? 'active' : ''}`}
            onClick={() => setActiveTab('train')}
          >
            {MinimalIcons.training}
            <span>Train</span>
          </button>
          <button 
            className={`tab-button hover-lift ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            {MinimalIcons.test}
            <span>Detect</span>
          </button>
        </div>

        <div className="dashboard-content">
          {isLoading ? (
            <div className="loading-state glass-effect">
              <div className="training-progress">
                <div className="progress-bar" style={{ width: '100%' }}>
                  <div className="progress-glow" />
                </div>
              </div>
              <span className="text-sm font-medium">Validating dataset...</span>
            </div>
          ) : (
            <>
              {datasetInfo && !datasetInfo.isValid ? (
                <div className="error-message glass-effect">
                  <h4 className="text-lg font-semibold mb-4">Dataset Validation Failed</h4>
                  {datasetInfo.errors.map((error, index) => (
                    <div key={index} className={`validation-error ${error.type} glass-effect`}>
                      <p className="error-message">
                        <strong className="text-pink-400">[{error.code}]</strong> {error.message}
                      </p>
                      {error.details && (
                        <pre className="error-details mt-2 p-2 rounded bg-black/20 text-sm">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  <button 
                    className="debug-toggle hover-lift mt-4"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>{showDebug ? 'Hide Debug Info' : 'Show Debug Info'}</span>
                  </button>
                  {showDebug && renderDebugInfo()}
                </div>
              ) : (
                <>
                  {activeTab === 'capture' && (
                    <DatasetCapture 
                      onStatusChange={handleCaptureStatus}
                      onSaveComplete={() => {
                        checkDataset();
                      }}
                    />
                  )}
                  {activeTab === 'train' && <ModelTrainer />}
                  {activeTab === 'test' && <ModelTester />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 