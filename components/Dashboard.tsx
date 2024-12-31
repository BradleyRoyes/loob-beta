'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer';
import Header from './Header';
import ThemeButton from './ThemeButton';

// Dynamically import components
const Profile = dynamic(() => import('./Profile'), { ssr: false });
const Map = dynamic(() => import('./Map'), { ssr: false });
const TorusSphere = dynamic(() => import('./Torusphere'));
const TorusSphereWeek = dynamic(() => import('./TorusSphereWeek'));
const TorusSphereAll = dynamic(() => import('./TorusSphereAll'));

const Dashboard: React.FC = () => {
  const [view, setView] = useState<string>('Dashboard');

  // Toggle view handler
  const handleToggleView = (newView: string) => {
    setView(newView);
  };

  const preserveState = () => {
    console.log('Preserving chat state...');
  };

  return (
    <div className="dashboard-container flex flex-col h-screen overflow-hidden bg-gradient-to-b from-pink-400 via-black to-black">
      {/* Header with routing functions */}
      <Header
        onBackClick={() => setView('Dashboard')} // Navigate back to the dashboard view
        toggleView={handleToggleView} // Switch between views dynamically
        preserveState={preserveState} // Preserve chat state
        onProfileClick={() => setView('Profile')} // Profile-specific toggle
      />

      <div className="flex flex-grow overflow-hidden">
        {/* Main Area */}
        <main className="flex-grow flex justify-center items-center">
          <div className="content-container w-full h-full p-4 flex justify-center items-center">
            {view === 'Profile' ? (
              <Profile onClose={() => setView('Dashboard')} />
            ) : view === 'Map' ? (
              <Map />
            ) : view === 'This Week' ? (
              <TorusSphereWeek />
            ) : view === 'All Time' ? (
              <TorusSphereAll />
            ) : (
              <div className="w-full h-full">
                <TorusSphere />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Theme Button */}
      <div className="absolute top-4 right-4 flex space-x-4">
        <ThemeButton />
      </div>

      {/* Footer */}
      <Footer className="p-4 md:p-8" />
    </div>
  );
};

export default Dashboard;
