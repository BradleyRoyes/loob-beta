'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalState } from './GlobalStateContext';
import LoobrarySignUp from './LoobrarySignUp';
import './SplashScreen.css';

const SplashScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setUserId, setSessionId, userId } = useGlobalState(); // Access global state
  const [phase, setPhase] = useState<'introPhase' | 'loginPhase' | 'signupPhase'>('introPhase');
  const [username, setUsername] = useState<string>(userId || ''); // Initialize with userId if available

  useEffect(() => {
    if (phase === 'introPhase') {
      const timer = setTimeout(() => setPhase('loginPhase'), 2000); // Auto-transition from intro to login
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleLogin = () => {
    if (username.trim()) {
      setUserId(username); // Save pseudonym to global state
      setSessionId(generateSessionId()); // Generate session ID
      onClose(); // Notify parent layout to close the splash screen
    } else {
      alert('Please enter a pseudonym.');
    }
  };

  const handleStayAnonymous = () => {
    const randomId = `anon-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(randomId); // Save anonymous ID in global state
    setSessionId(generateSessionId());
    onClose(); // Notify parent layout to close the splash screen
  };

  const handleSignUpComplete = () => {
    onClose(); // Notify parent layout to close the splash screen after sign-up
  };

  const generateSessionId = () => `session-${Math.random().toString(36).substr(2, 12)}`;

  return (
    <AnimatePresence>
      <motion.div
        className="splashScreen"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="gridBackground"></div>

        {/* Intro Phase */}
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
            <h2 className="superSubtitle">Berlin&apos;s Post-digital Lending library</h2>
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
                <button className="actionButton" onClick={() => setPhase('signupPhase')}>
                  Sign Up
                </button>
              </div>
              <button className="actionButton secondary" onClick={handleStayAnonymous}>
                Stay Anonymous
              </button>
            </div>
          </motion.div>
        )}

        {/* Sign-Up Phase */}
        {phase === 'signupPhase' && (
          <motion.div
            className="content signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <LoobrarySignUp
              onBack={() => setPhase('loginPhase')} // Navigate back to login phase
              onExplore={handleSignUpComplete} // Close splash screen after sign-up
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
