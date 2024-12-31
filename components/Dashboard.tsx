'use client';

import React, { useState } from 'react';
import Profile from './Profile'; // Directly import Profile
import Map from './Map'; // Directly import Map
import Footer from './Footer';
import Header from './Header';

const Dashboard: React.FC = () => {
  const [view, setView] = useState<string>('Profile');

  // Toggle view handler
  const handleToggleView = (newView: string) => {
    setView(newView);
  };

  const preserveState = () => {
    console.log('Preserving chat state...');
  };

  return (
    <div className="dashboard-container flex h-screen overflow-hidden bg-gradient-to-b from-pink-400 via-black to-black">
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col">
        {/* Header with routing functions */}
        <Header
          onBackClick={() => handleToggleView('Chat')} // Navigate back to Chat/home
          toggleView={handleToggleView} // Switch between views dynamically
          preserveState={preserveState} // Preserve chat state
          onProfileClick={() => handleToggleView('Profile')} // Profile-specific toggle
        />

        <main className="flex-grow flex justify-center items-center">
          <div className="content-container w-full h-full p-4 flex justify-center items-center">
            {view === 'Profile' ? (
              <Profile onClose={() => handleToggleView('Map')} />
            ) : view === 'Map' ? (
              <Map />
            ) : (
              <Profile onClose={() => handleToggleView('Map')} /> // Default to Profile
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
