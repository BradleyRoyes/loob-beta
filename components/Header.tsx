'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the Profile component to improve performance
const Profile = dynamic(() => import('./Profile'), { ssr: false });

interface HeaderProps {
  onBackClick: () => void;
  onProfileClick: () => void;
  onChatClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackClick, onProfileClick, onChatClick }) => {
  const [isProfileVisible, setIsProfileVisible] = useState(false); // State to track visibility of the Profile component

  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white border-b border-gray-700">
      {/* Logo navigates back to Dashboard */}
      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={onBackClick} // Clicking on the logo navigates back
      >
        <h1 className="text-3xl font-bold sm:text-2xl">Loob (beta)</h1> {/* App title/logo */}
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onChatClick} // Navigate to the chat page
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
        >
          Chat {/* Button for navigating to the Chat page */}
        </button>

        <button
          onClick={onProfileClick} // Trigger the Profile view
          className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
        >
          Profile {/* Button to toggle the Profile view */}
        </button>
      </div>

      {/* Render Profile Component */}
      {isProfileVisible && <Profile onClose={() => setIsProfileVisible(false)} />} {/* Conditionally render the Profile component if isProfileVisible is true */}
    </header>
  );
};

export default Header;
