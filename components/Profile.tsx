import React, { useState } from 'react';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';

const Profile: React.FC = () => {
  const [visualView, setVisualView] = useState<'Today' | 'This Week' | 'All Time'>('Today');
  const [vibeNodes, setVibeNodes] = useState([
    { id: 'Berghain', label: 'Berghain' },
    { id: 'Sisyphos', label: 'Sisyphos' },
  ]);

  return (
    <div className="profile-container flex flex-col h-full w-full p-4 bg-gray-900 text-white overflow-y-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Your Profile</h1>

      <div className="flex justify-center space-x-4 mb-4">
        {['Today', 'This Week', 'All Time'].map((view) => (
          <button
            key={view}
            onClick={() => setVisualView(view as 'Today' | 'This Week' | 'All Time')}
            className={`px-4 py-2 border rounded-md transition-colors ${
              visualView === view
                ? 'border-blue-500 text-white bg-blue-600'
                : 'border-gray-500 text-gray-300 hover:border-blue-500 hover:text-white'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      <div className="flex justify-center items-center mb-6">
        {visualView === 'Today' && <TorusSphere />}
        {visualView === 'This Week' && <TorusSphereWeek />}
        {visualView === 'All Time' && <TorusSphereAll />}
      </div>

      <div className="mb-4 text-center">
        <p className="text-lg">Anonymous Identifier: <span className="font-mono">0xA1B2C3D4</span></p>
        <p className="text-lg mt-4">Associated Vibes:</p>
        <ul className="list-disc list-inside mt-2">
          {vibeNodes.map((node) => (
            <li key={node.id}>{node.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
