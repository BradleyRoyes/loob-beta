"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalState } from "./GlobalStateContext";
import LoobrarySignUp from "./SignUp";
import "./SplashScreen.css";
import Image from 'next/image';

const SplashScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setUserState, setSessionId } = useGlobalState();
  const [phase, setPhase] = useState<"introPhase" | "loginPhase" | "signupPhase" | "closing">("introPhase");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (phase === "introPhase") {
      const timer = setTimeout(() => setPhase("loginPhase"), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleLogin = async () => {
    setLoginError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Check if user has a previously chosen companion
      const hasExistingCompanion = data.user.activeServitor || data.user.hasChosenCompanion;

      const userData = {
        userId: data.user._id,
        pseudonym: data.user.pseudonym,
        email: data.user.email || null,
        phone: data.user.phone || null,
        isAnonymous: false,
        hasChosenCompanion: hasExistingCompanion,
        activeServitor: data.user.activeServitor || null,
        connectedLoobricates: data.user.connectedLoobricates || []
      };

      setUserState(userData);
      
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userState', JSON.stringify(userData));

      setPhase("closing");
      setTimeout(() => onClose(), 1000);

    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStayAnonymous = () => {
    const anonId = `anon-${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      userId: anonId,
      pseudonym: 'Anonymous User',
      email: null,
      phone: null,
      isAnonymous: true,
      hasChosenCompanion: false,
      activeServitor: null,
      connectedLoobricates: []
    };
    
    setUserState(userData);
    setSessionId(generateSessionId());
    localStorage.setItem('userState', JSON.stringify(userData));
    
    setPhase("closing");
    setTimeout(() => onClose(), 1000);
  };

  const handleSignUpComplete = () => {
    // Ensure new users start without a companion
    const newUserData = {
      hasChosenCompanion: false,
      activeServitor: null
    };
    
    setUserState(newUserData);
    localStorage.setItem('userState', JSON.stringify(newUserData));
    
    setPhase("closing");
    setTimeout(() => onClose(), 1000);
  };

  const generateSessionId = () => `session-${Math.random().toString(36).substr(2, 12)}`;

  return (
    <motion.div 
      className={`splashScreen ${phase === "closing" ? "closing" : ""}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="gridBackground" />
      
      <AnimatePresence mode="wait">
        {phase === "introPhase" && (
          <motion.div 
            key="intro"
            className="content intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="centeredLogo">
              <Image 
                src="/favicon.ico"
                alt="Loob Logo"
                width={48}
                height={48}
                className="introLogo"
                priority
              />
            </div>
          </motion.div>
        )}

        {phase === "loginPhase" && (
          <motion.div 
            key="login"
            className="content login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="titleSection">
              <h1 className="mainTitle">Loob</h1>
              <h2 className="superSubtitle">Reducing Friction</h2>
            </div>
            <div className="inputContainer">
              <input
                type="text"
                placeholder="Enter your pseudonym"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pseudonymInput"
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pseudonymInput"
                disabled={loading}
              />
              {loginError && <p className="error">{loginError}</p>}
              <button
                className="actionButton"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
              <button
                className="actionButton secondary"
                onClick={handleStayAnonymous}
                disabled={loading}
              >
                Stay Anonymous
              </button>
              <p className="createAccountText" onClick={() => setPhase("signupPhase")}>
                Don't have an account? <span className="linkText">Sign up</span>
              </p>
            </div>
          </motion.div>
        )}

        {phase === "signupPhase" && (
          <motion.div 
            key="signup"
            className="content signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoobrarySignUp
              onBack={() => setPhase("loginPhase")}
              onExplore={handleSignUpComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SplashScreen;
