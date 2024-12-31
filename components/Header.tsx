'use client';

import React from 'react';

interface HeaderProps {
  onBackClick: () => void; // Callback to toggle back to Chat
  toggleView: (view: string) => void; // Callback to toggle main view
  preserveState: () => void; // Callback to preserve chat state
  onProfileClick: () => void; // Callback to switch to Profile view
}

const Header: React.FC<HeaderProps> = ({
  onBackClick,
  toggleView,
  preserveState,
  onProfileClick,
}) => {
  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white border-b border-gray-700">
      {/* Logo navigates back to Chat */}
      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={onBackClick} // Navigate to Chat
      >
        <h1 className="text-3xl font-bold sm:text-2xl">Loob (beta)</h1>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        {/* Chat Button */}
        <button
          onClick={() => {
            preserveState();
            onBackClick(); // Navigate to Chat
          }}
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
        >
          Chat
        </button>

        {/* Profile Button */}
        <button
          onClick={onProfileClick}
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
        >
          Profile
        </button>

        {/* Map Button */}
        <button
          onClick={() => toggleView('Map')}
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white"
        >
          Map
        </button>
      </div>
    </header>
  );
};

export default Header;
