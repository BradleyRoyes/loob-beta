'use client';

import React, { useState } from 'react';
import TorusSphere from '../../components/Torusphere';
import TorusSphereWeek from '../../components/TorusSphereWeek';
import TorusSphereAll from '../../components/TorusSphereAll';
import Footer from './Footer';
import Header from './Header';
import ThemeButton from '../../components/ThemeButton';
import Profile from './Profile';
import Map from './Map'; // Import the Map component

type DashboardPageProps = {
  onBackToChat: () => void; // Define the type of props here
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onBackToChat }) => {
  const [view, setView] = useState<string>('Dashboard'); // Manage active view

  return (
    <div className="dashboard-container flex flex-col h-screen overflow-hidden bg-gradient-to-b from-pink-400 via-black to-black">
      {/* Header */}
      <Header
        onBackClick={() => setView('Dashboard')} // Navigate back to Dashboard
        onProfileClick={() => setView('Profile')} // Always go to Profile
        onChatClick={onBackToChat} // Always return to Chat
      />

      <div className="flex flex-grow overflow-hidden">
        {/* Main Area */}
        <main className="flex-grow flex justify-center items-center">
          <div className="content-container w-full h-full p-4 flex justify-center items-center">
            {view === 'Profile' ? (
              <Profile />
            ) : view === 'Map' ? (
              <Map />
            ) : view === 'This Week' ? (
              <TorusSphereWeek />
            ) : view === 'All Time' ? (
              <TorusSphereAll />
            ) : (
              // Render TorusSphere component in the central panel for 'Today'
              <div className="w-full h-full">
                <TorusSphere />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar (Always Visible) */}
      <aside className="bottom-bar fixed bottom-16 w-full bg-black p-4 text-white flex justify-around items-center">
        <button
          onClick={() => setView('Map')}
          className={`button-dash text-lg py-2 px-4 rounded-md transition-colors ${
            view === 'Map' ? 'bg-blue-800 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          style={{ fontWeight: view === 'Map' ? 'bold' : 'normal' }}
        >
          LoobMap
        </button>
        {['Today', 'This Week', 'All Time'].map((label) => (
          <button
            key={label}
            onClick={() => setView(label)}
            className={`button-dash text-lg py-2 px-4 rounded-md transition-colors ${
              view === label
                ? 'bg-orange-600 text-white animate-pulse'
                : 'bg-transparent text-gray-400 hover:bg-orange-500 hover:text-white'
            }`}
            style={{ fontWeight: view === label ? 'bold' : 'normal' }}
          >
            {label}
          </button>
        ))}
      </aside>

      {/* Theme Button */}
      <div className="absolute top-4 right-4 flex space-x-4">
        <ThemeButton />
      </div>

      {/* Footer */}
      <Footer className="p-4 md:p-8" />
    </div>
  );
};

export default DashboardPage;
