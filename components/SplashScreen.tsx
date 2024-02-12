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
    setTimeout(onEnter, 1000);
  };

  const zoomVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
    exit: { scale: 1.05, opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  return (
    <div className="splashScreen">
      <motion.div
        className="options"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={zoomVariants}
      >
        {phase !== 'exit' && (
          <motion.div className="content" variants={zoomVariants}>
            <h1>Welcome to Loob</h1>
            {phase === 'selectLocation' && (
              <>
                <p>Where are you?</p>
                <button onClick={() => handleLocationSelect('mooseSpaceBerlin')}>Moose Space Berlin</button>
                <button onClick={() => handleLocationSelect('atTheClub')}>At the Club</button>
                <button onClick={() => handleLocationSelect('atHome')}>At Home</button>
              </>
            )}
            {phase === 'selectAction' && (
              <>
                <h2>What would you like to do?</h2>
                <button onClick={handleActionSelect}>I&apos;d like to share an experience</button>
                <button onClick={handleActionSelect}>I&apos;d like to host at MOOS</button>
                <button onClick={handleActionSelect}>I&apos;d like to visit MOOS</button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SplashScreen;
