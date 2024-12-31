'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer';
import Header from './Header';

// Dynamically import components
const Profile = dynamic(() => import('./Profile'), { ssr: false });
const Map = dynamic(() => import('./Map'), { ssr: false });

const Dashboard: React.FC = () => {
  const [view, setView] = useState<string>('Profile'); // Default to Profile view

  const handleToggleView = (newView: string) => {
    setView(newView);
  };

  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gradient-to-b from-pink-400 via-black to-black">
      {/* Header */}
      <Header
        onBackClick={() => handleToggleView('Chat')} // Navigate back to Chat
        toggleView={handleToggleView} // Switch between views
        preserveState={() => console.log('Preserving chat state...')} // Placeholder for state preservation
        onProfileClick={() => handleToggleView('Profile')} // Navigate to Profile
      />

      {/* Main Content Area */}
      <main className="flex-grow flex justify-center items-center">
        <div className="content-container w-full h-full p-4 flex justify-center items-center">
          {view === 'Profile' && <Profile onClose={() => handleToggleView('Map')} />}
          {view === 'Map' && <Map />}
        </div>
      </main>

      {/* Footer */}
      <Footer className="p-4 md:p-8" />
    </div>
  );
};

export default Dashboard;
