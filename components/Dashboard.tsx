'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer';
import Header from './Header';

// Dynamically import components
const Profile = dynamic(() => import('./Profile'), { ssr: false });
const Map = dynamic(() => import('./Map'), { ssr: false });

interface DashboardProps {
  onShowChat: () => void; // Callback to toggle visibility of the chat
}

const Dashboard: React.FC<DashboardProps> = ({ onShowChat }) => {
  const [view, setView] = useState<string>('Profile');

  // Toggle view handler
  const handleToggleView = (newView: string) => {
    setView(newView);
  };

  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gradient-to-b from-pink-400 via-black to-black">
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col">
        {/* Header with routing functions */}
        <Header
          onBackClick={onShowChat} // Navigate back to app/page.tsx (Chat)
          toggleView={handleToggleView} // Switch between views dynamically
          preserveState={() => console.log('Preserving chat state...')} // Placeholder for chat state
          onProfileClick={() => handleToggleView('Profile')} // Profile-specific toggle
        />

        <main className="flex-grow flex justify-center items-center">
          <div className="content-container w-full h-full max-w-4xl mx-auto p-4 bg-gray-900 rounded-md shadow-md overflow-y-auto">
            {view === 'Profile' ? (
              <Profile />
            ) : view === 'Map' ? (
              <Map />
            ) : (
              <Profile /> // Default to Profile
            )}
          </div>
        </main>

        {/* Footer */}
        <Footer className="p-4 md:p-8" />
      </div>
    </div>
  );
};

export default Dashboard;
