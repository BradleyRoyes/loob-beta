// SplashScreen.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './SplashScreen.css'; // Ensure you have this CSS file in your components folder


const SplashScreen: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState('selectLocation');

  const handleLocationSelect = (location: string) => {
    if (location === 'mooseSpaceBerlin') {
      setPhase('selectAction');
    } else {
      onEnter();
    }
  };

  const handleActionSelect = () => {
    onEnter();
  };

  const zoomVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
  };

  return (
    <motion.div className="options" initial="hidden" animate="visible" variants={zoomVariants}>
    <div className="splashScreen">
      {phase === 'selectLocation' && (
        <div className="options">
          <h1>Welcome to Loob</h1>
          <p>Where are you?</p>
          <button onClick={() => handleLocationSelect('mooseSpaceBerlin')}>Moose Space Berlin</button>
          <button onClick={() => handleLocationSelect('atTheClub')}>At the Club</button>
          <button onClick={() => handleLocationSelect('atHome')}>At Home</button>
        </div>
  </motion.div>
      )}

      {phase === 'selectAction' && (
        <div className="options">
          <h1>What would you like to do?</h1>
          <button onClick={handleActionSelect}>I'd like to share an experience</button>
          <button onClick={handleActionSelect}>I'd like to host at Moose</button>
          <button onClick={handleActionSelect}>I'd like to visit Moose</button>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
