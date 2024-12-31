'use client';

import React from 'react';

interface HeaderProps {
  onBackClick: () => void; // Function to navigate back to the Dashboard
  onProfileClick: () => void; // Function to navigate to Profile
  onChatClick: () => void; // Function to navigate back to Chat
}

const Header: React.FC<HeaderProps> = ({ onBackClick, onProfileClick, onChatClick }) => {
  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white border-b border-gray-700">
      {/* Logo */}
      <div className="flex items-center space-x-4 cursor-pointer" onClick={onBackClick}>
        <h1 className="text-3xl font-bold sm:text-2xl">Loob (beta)</h1>
      </div>

      {/* Right Side Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onChatClick}
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
        >
          Chat
        </button>
        <button
          onClick={onProfileClick}
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
        >
          Profile
        </button>
      </div>
    </header>
  );
};

export default Header;
