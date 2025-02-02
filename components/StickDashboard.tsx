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
  loading: () => (
    <div className="loading-state">
      <div className="training-progress">
        <div className="progress-bar" style={{ width: '100%' }}>
          <div className="progress-glow" />
        </div>
      </div>
      Loading trainer...
    </div>
  ),
  ssr: false
});

const DatasetCapture = dynamic(() => import('./DatasetCapture'), {
  loading: () => <div>Loading capture...</div>,
  ssr: false
});

const ModelTester = dynamic(() => import('./ModelTester'), {
  loading: () => <div>Loading tester...</div>,
  ssr: false
});

const StickDashboard: React.FC<StickDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('capture');
  const [datasetInfo, setDatasetInfo] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  // Check dataset on mount
  useEffect(() => {
    const checkDataset = async () => {
      try {
        console.log('Fetching dataset validation...');
        const response = await fetch('/api/dataset/validate');
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Validation request failed:', response.status, data);
          throw new Error(`Validation failed: ${response.status} ${response.statusText}`);
        }
        
        console.log('Validation response:', data);
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
            message: error.message,
            code: 'FETCH_ERROR'
          }],
          debug: {
            error: {
              message: error.message,
              stack: error.stack
            }
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

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
      <div className="stick-dashboard">
        <div className="dashboard-header">
          <h2>Stick Tracking System</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            {MinimalIcons.close}
          </button>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'capture' ? 'active' : ''}`}
            onClick={() => setActiveTab('capture')}
          >
            {MinimalIcons.training}
            <span>Capture</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'train' ? 'active' : ''}`}
            onClick={() => setActiveTab('train')}
          >
            {MinimalIcons.training}
            <span>Train</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            {MinimalIcons.test}
            <span>Test</span>
          </button>
        </div>

        <div className="dashboard-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="training-progress">
                <div className="progress-bar" style={{ width: '100%' }}>
                  <div className="progress-glow" />
                </div>
              </div>
              Validating dataset...
            </div>
          ) : (
            <>
              {datasetInfo && !datasetInfo.isValid ? (
                <div className="error-message">
                  <h4>Dataset Validation Failed</h4>
                  {datasetInfo.errors.map((error, index) => (
                    <div key={index} className={`validation-error ${error.type}`}>
                      <p className="error-message">
                        <strong>[{error.code}]</strong> {error.message}
                      </p>
                      {error.details && (
                        <pre className="error-details">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  <button 
                    className="debug-toggle"
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
                  {activeTab === 'capture' && <DatasetCapture />}
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
};

export default StickDashboard; 