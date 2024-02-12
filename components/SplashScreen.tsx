      import React, { useState } from 'react';
      import { motion } from 'framer-motion';
      import './SplashScreen.css'; // Ensure you have this CSS file in your components folder

      const SplashScreen: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
        const [phase, setPhase] = useState('selectLocation');

        const handleLocationSelect = (location: string) => {
          setPhase(location === 'mooseSpaceBerlin' ? 'selectAction' : 'exit');
          setTimeout(() => {
            if (location !== 'mooseSpaceBerlin') {
              onEnter();
            }
          }, 500); // This delay should match the exit animation duration
        };

        const handleActionSelect = () => {
          setPhase('exit');
          setTimeout(() => {
            onEnter();
          }, 500); // This delay should match the exit animation duration
        };

        const zoomVariants = {
          hidden: { scale: 0.95, opacity: 0 },
          visible: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
          exit: { scale: 1.05, opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
        };

        return (
          <div className="splashScreen">
            <motion.div
              className="options"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={zoomVariants}
            >
              {phase === 'selectLocation' && (
                <>
                  <h1>Welcome to Loob</h1>
                  <p>Where are you?</p>
                  <button onClick={() => handleLocationSelect('mooseSpaceBerlin')}>Moos Space Berlin</button>
                  <button onClick={() => handleLocationSelect('atTheClub')}>At the Club</button>
                  <button onClick={() => handleLocationSelect('atHome')}>At Home</button>
                </>
              )}

              {phase === 'selectAction' && (
                <>
                  <h1>What would you like to do?</h1>
                  <button onClick={handleActionSelect}>I'd like to share an experience</button>
                  <button onClick={handleActionSelect}>I'd like to host at Moos</button>
                  <button onClick={handleActionSelect}>I'd like to visit Moos</button>
                </>
              )}
            </motion.div>
          </div>
        );
      };

      export default SplashScreen;
