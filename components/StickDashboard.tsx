'use client';

import React, { useState } from 'react';
import VideoFrameExtractor from './VideoFrameExtractor';
import './StickDashboard.css';

interface StickDashboardProps {
  onClose: () => void;
}

const StickDashboard: React.FC<StickDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('videoFrames');

  return (
    <div className="stick-dashboard-overlay">
      <div className="stick-dashboard">
        <div className="dashboard-header">
          <h2>Stick Magic Dashboard</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'videoFrames' ? 'active' : ''}`}
            onClick={() => setActiveTab('videoFrames')}
          >
            Video Frame Extractor
          </button>
          {/* Add more tab buttons here as we add more tools */}
        </div>

        <div className="dashboard-content">
          {activeTab === 'videoFrames' && <VideoFrameExtractor />}
          {/* Add more tool components here as we add them */}
        </div>
      </div>
    </div>
  );
};

export default StickDashboard; 