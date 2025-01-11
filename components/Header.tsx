import React from 'react';
import './Header.css'; // Import updated CSS
import { UserIcon, MapIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  toggleView: (view: 'Chat' | 'Profile' | 'Map') => void;
  onConfigureClick: () => void; // Function to handle Configure button click
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
        className={`icon-button ${activeView === 'Profile' ? 'active' : ''}`}
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
          className={activeView === 'Chat' ? 'active' : ''}
          onClick={() => toggleView('Chat')}
        >
          Chat w/ Loob
        </button>
        <button
          className={activeView === 'Map' ? 'active' : ''}
          onClick={() => toggleView('Map')}
        >
          Discover
        </button>
      </div>

      {/* Map and Configure Icons */}
      <div className="flex space-x-4">
        <button
          className={`icon-button ${activeView === 'Map' ? 'active' : ''}`}
          onClick={() => toggleView('Map')}
        >
          <MapIcon className="h-6 w-6" />
        </button>
        <button
          className="icon-button"
          onClick={onConfigureClick} // Distinct handler for Configure
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
