import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from "./AudioRecorder";

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<"welcomePhase" | "introPhase" | "promptPhase">("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("a drink,\n or an experience?");
  const [fadeToBlack, setFadeToBlack] = useState(false);

  const proceed = useCallback(
    (nextPhase: "welcomePhase" | "introPhase" | "promptPhase") => {
      setPhase(nextPhase);
    },
    []
  );

  useEffect(() => {
    if (phase === "introPhase") {
      const timer = setTimeout(() => proceed("promptPhase"), 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, proceed]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setFadeToBlack(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "audio/webm");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setTimeout(() => onEnter(data.transcription), 1000);
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Error processing your audio. Please try again.");
    }
  };

  return (
    <div className={`splashScreen ${fadeToBlack ? "fadeOut" : ""}`}>
      <div className="gridBackground"></div>

      <div className="content">
        {phase === "welcomePhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="gradientText biggerText">
              Loob <span className="smallText">beta</span>
            </h2>
            <button className="actionButton" onClick={() => proceed("introPhase")}>
              Start
            </button>
          </motion.div>
        )}

        {phase === "introPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="gradientText">Welcome to the Cyberdelic Showcase</h1>
          </motion.div>
        )}

        {phase === "promptPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="gradientText">Whatcha in the mood for?</h3>
            <h2 className="gradientText" style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>
              {randomPrompt}
            </h2>
            <div className="recordWrapper">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </div>
          </motion.div>
        )}
      </div>

      {fadeToBlack && (
        <motion.div
          className="fadeOverlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        ></motion.div>
      )}
    </div>
  );
};

export default SplashScreen;
