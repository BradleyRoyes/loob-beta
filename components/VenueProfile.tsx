import React, { useState } from 'react';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';

const VenueProfile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [visualView, setVisualView] = useState<'Today' | 'This Week' | 'All Time'>('Today');
  const [vibeNodes, setVibeNodes] = useState([
    { id: 'Event1', label: 'Underground Techno Night' },
    { id: 'Event2', label: 'Open Air Chill' },
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      {/* Modal Content */}
      <div className="relative bg-gray-800 text-white rounded-lg shadow-lg max-w-4xl w-full p-6">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-lg"
          onClick={onClose}
        >
          ✖
        </button>

        {/* Venue Title */}
        <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-center">Berghain</h2>

        {/* Venue Info */}
        <div className="text-center mb-6">
          <p className="text-lg sm:text-xl mb-2">
            Vibe: <span className="italic">Pulsating beats and untamed energy</span>
          </p>
          <p className="text-lg sm:text-xl mb-2">Location: Berlin, Germany</p>
          <p className="text-lg sm:text-xl mt-4 font-semibold">Upcoming Events:</p>
          <ul className="list-disc list-inside mt-2 text-sm sm:text-lg">
            {vibeNodes.map((node) => (
              <li key={node.id} className="mt-1">{node.label}</li>
            ))}
          </ul>
        </div>

        {/* View Selector */}
        <div className="flex justify-center space-x-2 sm:space-x-4 mb-6">
          {['Today', 'This Week', 'All Time'].map((view) => (
            <button
              key={view}
              onClick={() => setVisualView(view as 'Today' | 'This Week' | 'All Time')}
              className={`px-4 py-2 rounded-lg ${
                visualView === view
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Visualization */}
        <div className="flex justify-center items-center bg-black p-4 rounded-lg mb-6">
          {visualView === 'Today' && <TorusSphere />}
          {visualView === 'This Week' && <TorusSphereWeek />}
          {visualView === 'All Time' && <TorusSphereAll />}
        </div>

        {/* Organizer Login */}
        <div className="text-center">
          <button
            className="px-6 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-400"
            onClick={() => alert('Redirecting to Organizer Dashboard...')}
          >
            Organizer Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueProfile;
