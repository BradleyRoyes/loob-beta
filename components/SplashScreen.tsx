"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalState } from "./GlobalStateContext"; // Adjust path if needed
import LoobrarySignUp from "./SignUp"; // Adjust path if needed
import "./SplashScreen.css";
import Image from 'next/image';

const SplashScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setUserState, setSessionId } = useGlobalState();
  const [phase, setPhase] = useState<"introPhase" | "loginPhase" | "signupPhase" | "fadeOut">(
    "introPhase"
  );
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Fade from intro to login after 2s
  useEffect(() => {
    if (phase === "introPhase") {
      const timer = setTimeout(() => setPhase("loginPhase"), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  /**
   * Attempt to log in with the typed pseudonym + password.
   * We do two steps:
   *  (1) Set userId in global state to what user typed.
   *  (2) Then attempt server auth. If it fails, you can revert userId or keep it.
   */
  const handleLogin = async () => {
    setLoginError("");
    setLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        setLoginError("Please enter both a pseudonym and a password.");
        return;
      }

      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Important: Set all user state at once
      setUserState({
        userId: data.user.id || data.user.pseudonym, // Make sure this matches your API response
        pseudonym: data.user.pseudonym,
        email: data.user.email,
        phone: data.user.phone,
        isAnonymous: false
      });

      // Set session after successful login
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);

      // Store login state
      localStorage.setItem('isLoggedIn', 'true');

      setPhase("fadeOut");
      setTimeout(() => onClose(), 1000);

    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Stay anonymous => set userId to random + session ID
  const handleStayAnonymous = () => {
    const anonId = `anon-${Math.random().toString(36).substr(2, 9)}`;
    setUserState({
      userId: anonId,
      pseudonym: 'Anonymous User',
      email: null,
      phone: null,
      isAnonymous: true
    });
    setSessionId(generateSessionId());
    onClose();
  };

  // On sign-up complete, close the splash
  const handleSignUpComplete = () => {
    onClose();
  };

  // Generates a unique session ID
  const generateSessionId = () => `session-${Math.random().toString(36).substr(2, 12)}`;

  return (
    <AnimatePresence>
      <motion.div
        className={`splashScreen ${phase === "fadeOut" ? "fadeOut" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
      >
        {/* Background grid */}
        <div className="gridBackground"></div>
        {phase === "introPhase" && (
          <div className="content intro centeredContainer">
            <div className="logoContainer">
              <Image 
                src="/favicon.ico"
                alt="Loob Logo"
                width={80}
                height={80}
                className="introLogo"
                priority
              />
            </div>
          </div>
        )}

        {/* Login Phase */}
        {phase === "loginPhase" && (
          <div className="content login">
            <div className="titleContainer">
              <Image 
                src="/favicon.ico"
                alt="Loob Logo"
                width={40}
                height={40}
                className="titleLogo"
                priority
              />
              <h1 className="mainTitle">Loob</h1>
            </div>
            <h2 className="superSubtitle">Reducing Friction</h2>
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
              {loginError && (
                <p className="error">
                  {loginError}
                </p>
              )}
              <div className="buttonGroup">
                <button
                  className="actionButton"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
                <button
                  className="actionButton"
                  onClick={() => setPhase("signupPhase")}
                  disabled={loading}
                >
                  Sign Up
                </button>
              </div>
              <button
                className="actionButton secondary"
                onClick={handleStayAnonymous}
                disabled={loading}
              >
                Stay Anonymous
              </button>
            </div>
          </div>
        )}

        {/* Sign-Up Phase */}
        {phase === "signupPhase" && (
          <div className="content signup">
            <LoobrarySignUp
              onBack={() => setPhase("loginPhase")}
              onExplore={handleSignUpComplete}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
