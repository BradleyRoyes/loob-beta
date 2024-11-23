'use client';

import React from 'react';

// Define the props interface with optional callbacks
interface HeaderProps {
  onBackClick?: () => void;  // Optional, as it may not always be needed
  onProfileClick?: () => void; // Optional, as it may not always be needed
  onChatClick?: () => void;  // Optional, as it may not always be needed
}

const Header: React.FC<HeaderProps> = ({
  onBackClick,
  onProfileClick,
  onChatClick,
}) => {
  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white border-b border-gray-700">
      {/* Logo and Back Button */}
      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={onBackClick}
      >
        {onBackClick && (
          <h1 className="text-3xl font-bold sm:text-2xl">Loob (beta)</h1>
        )}
      </div>

      {/* Right Side Buttons */}
      <div className="flex space-x-4">
        {onChatClick && (
          <button
            onClick={onChatClick}
            className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
          >
            Chat
          </button>
        )}
        {onProfileClick && (
          <button
            onClick={onProfileClick}
            className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
          >
            Profile
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
