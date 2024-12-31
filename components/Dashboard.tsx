'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from './Footer';
import Header from './Header';
import ThemeButton from './ThemeButton';

// Dynamically import components
const Profile = dynamic(() => import('./Profile'), { ssr: false });
const Map = dynamic(() => import('./Map'), { ssr: false });

interface DashboardProps {
  onShowChat: () => void; // Function to show the chat (app/page.tsx)
}

const Dashboard: React.FC<DashboardProps> = ({ onShowChat }) => {
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
      {/* Sidebar Navigation */}
      <aside className="sidebar bg-black text-white w-1/4 p-4 flex flex-col space-y-4">
        <button
          onClick={() => handleToggleView('Map')}
          className={`button-sidebar text-lg py-2 px-4 rounded-md transition-colors ${
            view === 'Map' ? 'bg-blue-600 text-white font-bold' : 'bg-transparent text-gray-400 hover:bg-blue-500 hover:text-white'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => handleToggleView('Profile')}
          className={`button-sidebar text-lg py-2 px-4 rounded-md transition-colors ${
            view === 'Profile' ? 'bg-purple-600 text-white font-bold' : 'bg-transparent text-gray-400 hover:bg-purple-500 hover:text-white'
          }`}
        >
          Profile
        </button>
        <button
          onClick={onShowChat} // Switch back to the main Chat interface
          className="button-sidebar text-lg py-2 px-4 rounded-md bg-green-600 text-white hover:bg-green-500 font-bold"
        >
          Chat
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col">
        {/* Header with routing functions */}
        <Header
          onBackClick={onShowChat} // Back to chat
          toggleView={handleToggleView} // Switch between views dynamically
          preserveState={preserveState} // Preserve chat state
          onProfileClick={() => setView('Profile')} // Profile-specific toggle
        />

        <main className="flex-grow flex justify-center items-center">
          <div className="content-container w-full h-full p-4 flex justify-center items-center">
            {view === 'Profile' ? (
              <Profile onClose={() => setView('Map')} />
            ) : view === 'Map' ? (
              <Map />
            ) : (
              <Profile onClose={() => setView('Map')} /> // Default to Profile
            )}
          </div>
        </main>

        {/* Footer */}
        <Footer className="p-4 md:p-8" />
      </div>

      {/* Theme Button */}
      <div className="absolute top-4 right-4 flex space-x-4">
        <ThemeButton />
      </div>
    </div>
  );
};

export default Dashboard;
