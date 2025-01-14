"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalState } from "./GlobalStateContext"; // Adjust path if needed
import LoobrarySignUp from "./LoobrarySignUp"; // Adjust path if needed
import "./SplashScreen.css";

const SplashScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userId, setUserId, setSessionId } = useGlobalState();
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

    // 1) Basic input checks
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both a pseudonym and a password.");
      setLoading(false);
      return;
    }

    // 2) Immediately set userId in the global state
    setUserId(username.trim());

    try {
      // 3) Attempt server authentication
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym: username.trim(), password }),
      });

      setLoading(false);

      if (!response.ok) {
        const errorData = await response.json();
        setLoginError(errorData.error || "Login failed. Check your credentials.");
        // Optionally revert userId if you don't want the pseudonym set on failure
        // setUserId(null);
        return;
      }

      // 4) On success, parse the pseudonym from server
      const { pseudonym } = await response.json();
      console.log("Server says login successful. Confirming userId:", pseudonym);

      // 5) Optionally: re-set userId to what server says
      //    If you trust the user typed the correct one, skip this if you want.
      setUserId(pseudonym);

      // 6) Set session ID, do fade-out
      setSessionId(generateSessionId());
      setPhase("fadeOut");
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error("Error logging in:", error);
      setLoginError("An unexpected error occurred.");
      setLoading(false);

      // If you want to revert userId on fatal error:
      // setUserId(null);
    }
  };

  // Stay anonymous => set userId to random + session ID
  const handleStayAnonymous = () => {
    const anonId = `anon-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(anonId);
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
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Background grid */}
        <div className="gridBackground"></div>

        {/* Intro Phase */}
        {phase === "introPhase" && (
          <motion.div
            className="content intro"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="logoText">Loob</h1>
          </motion.div>
        )}

        {/* Login Phase */}
        {phase === "loginPhase" && (
          <motion.div
            className="content login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="mainTitle">Loob</h1>
            <h2 className="superSubtitle">Berlin&apos;s Post-digital Lending Library</h2>
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
                <motion.p
                  className="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {loginError}
                </motion.p>
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
          </motion.div>
        )}

        {/* Sign-Up Phase */}
        {phase === "signupPhase" && (
          <motion.div
            className="content signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <LoobrarySignUp
              onBack={() => setPhase("loginPhase")}
              onExplore={handleSignUpComplete}
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
