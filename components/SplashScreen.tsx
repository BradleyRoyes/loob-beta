import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from "../components/AudioRecorder";

const SplashScreen = ({ onEnter }) => {
  const [phase, setPhase] = useState("welcome");

  const proceed = (nextPhase) => {
    setPhase(nextPhase);
  };

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 1.5, ease: "easeInOut" } },
  };

  const onRecordingComplete = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Transcription:", data.transcription);

      onEnter(data.transcription); // Assuming this triggers the transition to the chat screen
      setPhase("exit"); // Trigger exit animation
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          className="splashScreen"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {phase === "welcome" && (
            <motion.div className="content" variants={variants}>
              <h1 className="gradientText">Welcome to Loob</h1>
              <button onClick={() => proceed("introduction")}>Enter</button>
            </motion.div>
          )}

          {phase === "introduction" && (
            <motion.div className="content" variants={variants}>
              <h1 className="gradientText">
                I’m loob, a listener. An urban story container to help us tell new stories about new experiences.
                <br />
                <br />
                Movement is everything, nothing is the goal.
              </h1>
              <button onClick={() => proceed("karneval")}>Continue</button>
            </motion.div>
          )}

          {phase === "karneval" && (
            <motion.div className="content" variants={variants}>
              <h1 className="gradientText">Today, we are celebrating the partial legalisation of Cannabis</h1>
              <h2 className="gradientText">
                Tell me, how do you feel legalisation will change your relationship with Cannabis?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <AudioRecorder onRecordingComplete={onRecordingComplete} />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
