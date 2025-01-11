'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalState } from './GlobalStateContext';
import LoobrarySignUp from './LoobrarySignUp';
import './SplashScreen.css';

const SplashScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setUserId, setSessionId } = useGlobalState();
  const [phase, setPhase] = useState<'introPhase' | 'loginPhase' | 'signupPhase'>('introPhase');
  const [username, setUsername] = useState<string>('');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    if (phase === 'introPhase') {
      const timer = setTimeout(() => setPhase('loginPhase'), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleLogin = () => {
    if (username.trim()) {
      setUserId(username);
      setSessionId(generateSessionId());
      closeSplash();
    } else {
      alert('Please enter a pseudonym.');
    }
  };

  const handleStayAnonymous = () => {
    const randomId = `anon-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(randomId);
    setSessionId(generateSessionId());
    closeSplash();
  };

  const handleSignUp = () => {
    setPhase('signupPhase');
  };

  const closeSplash = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 1000);
  };

  const generateSessionId = () => `session-${Math.random().toString(36).substr(2, 12)}`;

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          className="splashScreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="gridBackground"></div>

          {/* Intro Phase with "Loob" Text */}
          {phase === 'introPhase' && (
            <motion.div
              className="content intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 className="logoText">Loob</h1>
            </motion.div>
          )}

          {/* Login Phase */}
          {phase === 'loginPhase' && (
            <motion.div
              className="content login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 className="mainTitle">Loob</h1>
              <h2 className="superSubtitle">The experience designer's library</h2>
              <div className="inputContainer">
                <input
                  type="text"
                  placeholder="Enter your pseudonym"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pseudonymInput"
                />
                <div className="buttonGroup">
                  <button className="actionButton" onClick={handleLogin}>
                    Log In
                  </button>
                  <button className="actionButton" onClick={handleSignUp}>
                    Sign Up
                  </button>
                </div>
                <button className="actionButton secondary" onClick={handleStayAnonymous}>
                  Stay Anonymous
                </button>
              </div>
            </motion.div>
          )}

          {/* SignUp Phase */}
          {phase === 'signupPhase' && (
            <motion.div
              className="content signup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <LoobrarySignUp onBack={() => setPhase('loginPhase')} />
            </motion.div>
          )}
        </motion.div>
      )}

      {isClosing && (
        <motion.div
          className="fadeOverlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
