import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from "./AudioRecorder";

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<"welcomePhase" | "introPhase" | "promptPhase">("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [fadeToBlack, setFadeToBlack] = useState<boolean>(false);

  const proceed = useCallback(
    (nextPhase: "welcomePhase" | "introPhase" | "promptPhase") => {
      setPhase(nextPhase);
      if (nextPhase === "promptPhase") {
        setRandomPrompt("a drink,\n or an experience?");
      }
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
      onEnter(data.transcription);
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("There was an error processing your audio. Please try again.");
    }
  };

  return (
    <div className="splashScreen" style={{ padding: "3rem" }}>
      {/* 3D Grid Background */}
      <div className="gridBackground"></div>

      <div className="content" style={{ padding: "1.5rem" }}>
        {phase === "welcomePhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="gradientText biggerText">Hi.<br />I am Loob.</h2>
            <div className="mt-4">
              <button className="actionButton" onClick={() => proceed("introPhase")}>Enter</button>
            </div>
          </motion.div>
        )}

        {phase === "introPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="gradientText">
              Welcome to the Cyberdelic Showcase<br />
            
            </h1>
            <div className="mt-4">
              <button className="actionButton" onClick={() => proceed("promptPhase")}>Continue</button>
            </div>
          </motion.div>
        )}

        {phase === "promptPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="gradientText" style={{ marginBottom: "2rem" }}>Whatcha in the mood for?</h3>
            <h2 className="gradientText" style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", marginBottom: "2rem" }}>{randomPrompt}</h2>
            <div className="buttonContainer mt-6" style={{ marginTop: "2.5rem" }}>
              <div className="recordWrapper" style={{ boxShadow: "none" }}>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  startRecording={() => console.log("Recording started")}
                />
                {/*
                <button
                  className="newPromptButton mt-4"
                  onClick={() => setRandomPrompt(getRandomPrompt())}
                >
                  New Question
                </button>
                */}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fade-to-Black Overlay */}
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
