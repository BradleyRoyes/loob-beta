"use client";

import React from 'react';
import { UserIcon, MapIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import './Header.css'; // Import only component-specific styles

interface HeaderProps {
  toggleView: (view: 'Chat' | 'Profile' | 'Map') => void;
  onConfigureClick: () => void;
  activeView: 'Chat' | 'Profile' | 'Map';
}

const Header: React.FC<HeaderProps> = ({
  toggleView,
  onConfigureClick,
  activeView,
}) => {
  return (
    <header>
      {/* Profile Icon */}
      <button
        className={`icon-button base-button ${
          activeView === 'Profile' ? 'active' : ''
        }`}
        onClick={() => toggleView('Profile')}
      >
        <UserIcon className="h-6 w-6" />
      </button>

      {/* Slider */}
      <div className="slider-container">
        <div
          className={`slider-pill ${
            activeView === 'Chat' ? 'active-chat' : 'active-discover'
          }`}
        ></div>
        <button
          className={`base-button ${
            activeView === 'Chat' ? 'active' : ''
          }`}
          onClick={() => toggleView('Chat')}
        >
          Chat w/ Loob
        </button>
        <button
          className={`base-button ${
            activeView === 'Map' ? 'active' : ''
          }`}
          onClick={() => toggleView('Map')}
        >
          Discover
        </button>
      </div>

      {/* Map and Configure Icons */}
      <div className="flex space-x-4">
        <button
          className={`icon-button base-button ${
            activeView === 'Map' ? 'active' : ''
          }`}
          onClick={() => toggleView('Map')}
        >
          <MapIcon className="h-6 w-6" />
        </button>
        <button
          className="icon-button base-button"
          onClick={onConfigureClick}
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
