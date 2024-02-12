// SplashScreen.tsx
import React, { useState } from 'react';
import TunnelTransition from '../components/TunnelTransition'; // Adjust if your import path differs

const SplashScreen = ({ onEnter }) => {
  const [phase, setPhase] = useState('selectLocation');

  const handleLocationSelect = () => {
    setPhase('selectAction');
  };

  const handleActionSelect = (action) => {
    console.log(action); // Example action logging, replace with your navigation logic
    onEnter(); // Simulate proceeding to the main content
  };

  return (
    <TunnelTransition>
      {phase === 'selectLocation' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white space-y-8 p-4">
          <h1 className="text-2xl font-bold mb-4">Welcome to Loob</h1>
          <p className="mb-4">Where are you?</p>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleLocationSelect('mooseSpaceBerlin')}>
            Moose Space Berlin
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleLocationSelect('atTheClub')}>
            At the Club
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleLocationSelect('atHome')}>
            At Home
          </button>
        </div>
      )}

      {phase === 'selectAction' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white space-y-8 p-4">
          <h1 className="text-2xl font-bold mb-4">What would you like to do?</h1>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleActionSelect('share')}>
            I&apos;d like to share an experience
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleActionSelect('host')}>
            I&apos;d like to host at Moose
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleActionSelect('visit')}>
            I&apos;d like to visit Moose
          </button>
        </div>
      )}
    </TunnelTransition>
  );
};

export default SplashScreen;
