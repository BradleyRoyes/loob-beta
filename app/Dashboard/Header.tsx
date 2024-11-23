'use client';

import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-black text-white border-b border-gray-700">
      {/* Logo - Link back to Dashboard */}
      <Link href="/dashboard">
        <div className="flex items-center space-x-4 cursor-pointer">
          <h1 className="text-3xl font-bold sm:text-2xl">Loob (beta)</h1>
        </div>
      </Link>

      {/* Right Side Buttons */}
      <div className="flex space-x-4">
        {/* Link to Chat */}
        <Link href="/">
          <button className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white">
            Chat
          </button>
        </Link>

        {/* Link to Profile (assuming the Profile is part of the dashboard or another route) */}
        <Link href="/dashboard#profile">
          <button className="button-header px-4 py-2 border border-white text-white rounded-md transition-all hover:bg-gradient-to-r hover:from-pink-300 hover:to-orange-300 hover:text-white">
            Profile
          </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
