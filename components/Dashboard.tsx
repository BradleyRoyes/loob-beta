'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer';

// Dynamically import components
const Profile = dynamic(() => import('./Profile'), { ssr: false });
const Map = dynamic(() => import('./Map'), { ssr: false });

interface DashboardProps {
  onShowChat: () => void; // Callback to toggle visibility of the chat
}

const Dashboard: React.FC<DashboardProps> = ({ onShowChat }) => {
  const [view, setView] = useState<string>('Map');

  const handleToggleView = (newView: string) => setView(newView);

  return (
    <div
      className="dashboard-container flex flex-col h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #fde2c8 0%, #000000 40%, #000000 80%)',
      }}
    >
      {/* Main Content Area */}
      <div className="flex-grow relative">
        {view === 'Profile' ? (
          <div className="content-container w-full h-full max-w-4xl mx-auto p-4 bg-white/80 backdrop-blur-sm rounded-md shadow-md overflow-y-auto">
            <Profile />
          </div>
        ) : view === 'Map' ? (
          <div className="absolute inset-0">
            <Map />
          </div>
        ) : (
          <div className="content-container w-full h-full max-w-4xl mx-auto p-4 bg-white/80 backdrop-blur-sm rounded-md shadow-md overflow-y-auto">
            <Profile />
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer className="p-4 md:p-8" />
    </div>
  );
};

export default Dashboard;
