import React, { useState } from 'react';
import TunnelTransition from './TunnelTransition'; // Adjust if your import path differs

const SplashScreen = ({ onEnter }) => {
  const [phase, setPhase] = useState('selectLocation');
  const [isVisible, setIsVisible] = useState(true);

  // Updated to accept a location argument
  const handleLocationSelect = (location) => {
    setIsVisible(false); // Start the exit animation
    setTimeout(() => {
      // Decide next phase based on selected location
      if (location === 'mooseSpaceBerlin') {
        setPhase('selectAction'); // Transition to the actions selection for Moose Space Berlin
      } else {
        onEnter(); // For other locations, proceed to the main content
      }
      setIsVisible(true); // Reset visibility for the next phase or content
    }, 1500); // Duration matching the animation
  };

  const handleActionSelect = (action) => {
    console.log(action); // For demonstration, replace with your actual handling logic
    setIsVisible(false);
    setTimeout(() => {
      onEnter(); // Proceed to the main content after selection
    }, 1500);
  };

  return (
    <TunnelTransition isVisible={isVisible} onExit={() => {}}>
      {phase === 'selectLocation' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white space-y-8 p-4">
          <h1 className="text-2xl font-bold mb-4">Welcome to Loob</h1>
          <p className="mb-4">Where are you?</p>
          {/* Now correctly passing the location as an argument */}
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleLocationSelect('mooseSpaceBerlin')}>
            MOOS Space Berlin
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
            I'd like to share an experience
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleActionSelect('host')}>
            I'd like to host at Moose
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150 ease-in-out" onClick={() => handleActionSelect('visit')}>
            I'd like to visit Moose
          </button>
        </div>
      )}
    </TunnelTransition>
  );
};

export default SplashScreen;
