'use client';

import React from 'react';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';

interface VisualsProps {
  view: 'Today' | 'This Week' | 'All Time'; // Define the time scope for visuals
}

const Visuals: React.FC<VisualsProps> = ({ view }) => {
  const renderVisualContent = () => {
    switch (view) {
      case 'Today':
        return <TorusSphere />;
      case 'This Week':
        return <TorusSphereWeek />;
      case 'All Time':
        return <TorusSphereAll />;
      default:
        return <div className="text-white">Invalid view</div>;
    }
  };

  return (
    <div className="visuals-container flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-black to-gray-900">
      {renderVisualContent()}
    </div>
  );
};

export default Visuals;
