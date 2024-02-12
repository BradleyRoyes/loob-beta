import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './SplashScreen.css'; // Make sure this CSS is scoped to avoid outside styling issues

const SplashScreen: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState('selectLocation');

  const handleLocationSelect = (location: string) => {
    if (location === 'mooseSpaceBerlin') {
      setPhase('selectAction');
    } else {
      setPhase('exit');
      setTimeout(onEnter, 1000); // Delay to allow animation to complete
    }
  };

  const handleActionSelect = () => {
    setPhase('exit');
    setTimeout(onEnter, 1000); // Delay to allow animation to complete
  };

  // Animation variants for a subtle zoom effect
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.5, ease: 'easeIn' } },
  };

  return (
    <motion.div
      className="splashScreen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
    >
      {phase !== 'exit' && (
        <motion.div className="content" variants={containerVariants}>
          <h1>Welcome to Loob</h1>
          {phase === 'selectLocation' && (
            <>
              <p>Where are you?</p>
              <button onClick={() => handleLocationSelect('mooseSpaceMOOS')}>MOOS Space Berlin</button>
              <button onClick={() => handleLocationSelect('atTheClub')}>At the Club</button>
              <button onClick={() => handleLocationSelect('atHome')}>At Home</button>
            </>
          )}
          {phase === 'selectAction' && (
            <>
              <h2>What would you like to do?</h2>
              <button onClick={handleActionSelect}>I'd like to share an experience</button>
              <button onClick={handleActionSelect}>I'd like to host at MOOS</button>
              <button onClick={handleActionSelect}>I'd like to visit MOOS</button>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
