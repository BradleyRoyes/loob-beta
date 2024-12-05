'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the Profile component to improve performance
const Profile = dynamic(() => import('./Profile'), { ssr: false });

const Header = () => {
  const router = useRouter(); // useRouter hook allows navigation to different routes
  const pathname = usePathname(); // usePathname hook returns the current route pathname
  const [isProfileVisible, setIsProfileVisible] = useState(false); // State to track visibility of the Profile component

  const handleNavigationToChat = () => {
    // Navigate to the chat page without triggering the splash screen
    router.push('/');
  };

  const handleNavigationToHume = () => {
    // Navigate to the Hume integration page
    router.push('/hume');
  };

  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white border-b border-gray-700">
      {/* Logo navigates back to main page without splash screen */}
      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={handleNavigationToChat} // Clicking on the logo navigates to the chat page, skipping the splash screen
      >
        <h1 className="text-3xl font-bold sm:text-2xl">Loob (beta)</h1> {/* App title/logo */}
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        {pathname !== '/' && (
          <button
            onClick={handleNavigationToChat} // Navigate to the chat page and skip the splash screen
            className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
          >
            Chat {/* Button for navigating to the Chat page */}
          </button>
        )}

        {pathname !== '/dashboard' && (
          <button
            onClick={() => {
              router.prefetch('/dashboard');
              router.push('/dashboard');
            }} // Prefetch and navigate to the dashboard if not already there
            className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white"
          >
            Dashboard {/* Button for navigating to the Dashboard */}
          </button>
        )}

        {pathname !== '/hume' && (
          <button
            onClick={handleNavigationToHume} // Navigate to the Hume page
            className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-blue-300 hover:to-green-300 hover:text-white"
          >
            Call Loob {/* Button for navigating to the Hume page */}
          </button>
        )}

        {/* Toggle Profile Visibility */}
        <button
          onClick={() => setIsProfileVisible(!isProfileVisible)} // Toggle the visibility of the Profile component
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
