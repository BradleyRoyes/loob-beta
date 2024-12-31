'use client';

import React, { useState } from 'react';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';

const Profile: React.FC = () => {
  const [visualView, setVisualView] = useState<'Today' | 'This Week' | 'All Time'>('Today');

  return (
    <div className="profile-container flex flex-col h-full w-full p-4 bg-gray-900 text-white overflow-y-auto">
      {/* Profile Header */}
      <h1 className="text-3xl font-bold mb-4 text-center">Your Profile</h1>

      {/* Visuals Toggle */}
      <div className="flex justify-center space-x-4 mb-4">
        {['Today', 'This Week', 'All Time'].map((view) => (
          <button
            key={view}
            onClick={() => setVisualView(view as 'Today' | 'This Week' | 'All Time')}
            className={`px-4 py-2 rounded-md transition-colors ${
              visualView === view
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Render the Visual Based on Toggle */}
      <div className="flex justify-center items-center mb-6">
        {visualView === 'Today' && <TorusSphere />}
        {visualView === 'This Week' && <TorusSphereWeek />}
        {visualView === 'All Time' && <TorusSphereAll />}
      </div>

      {/* User Info */}
      <div className="mb-4 text-center">
        <p className="text-lg">
          Anonymous Identifier: <span className="font-mono">0xA1B2C3D4</span>
        </p>
        <p className="text-lg mt-4">List of chosen integrations:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Poi</li>
          <li>ISO stick</li>
          <li>Watch</li>
          <li>LoobLab</li>
        </ul>
      </div>
    </div>
  );
};

export default Profile;
