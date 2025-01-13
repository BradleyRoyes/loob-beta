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

  // NEW: Password state
  const [password, setPassword] = useState<string>('');

  // NEW: Track login errors
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    if (phase === 'introPhase') {
      const timer = setTimeout(() => setPhase('loginPhase'), 2000); // Auto-transition from intro to login
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // NEW: Updated handleLogin to call /api/auth/login
  const handleLogin = async () => {
    setLoginError(''); // Reset error each time user tries login

    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both a pseudonym and a password.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudonym: username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setLoginError(errorData.error || 'Login failed. Check your credentials.');
        return;
      }

      // If successful, parse user data from server
      const { pseudonym } = await response.json();

      // Save pseudonym globally
      setUserId(pseudonym);

      // Generate and save a session ID, etc. (not from the DB, just local for now)
      setSessionId(generateSessionId());

      // Close the splash screen
      onClose();
    } catch (error) {
      console.error('Error logging in:', error);
      setLoginError('An unexpected error occurred.');
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
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pseudonymInput"
              />

              {/* Display login error if any */}
              {loginError && <p className="error">{loginError}</p>}

              <div className="buttonGroup">
                <button className="actionButton" onClick={handleLogin}>
                  Log In
                </button>
                <button
                  className="actionButton"
                  onClick={() => setPhase('signupPhase')}
                >
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
