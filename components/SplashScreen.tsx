import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from "./AudioRecorder";

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<
    "welcomePhase" | "introPhase" | "modalityPhase" | "promptPhase"
  >("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [fadeToBlack, setFadeToBlack] = useState<boolean>(false);

  const proceed = useCallback(
    (nextPhase: "welcomePhase" | "introPhase" | "modalityPhase" | "promptPhase") => {
      setPhase(nextPhase);
    },
    []
  );

  useEffect(() => {
    if (phase === "introPhase") {
      proceed("modalityPhase"); // Removed delay
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
            <h2 className="gradientText biggerText">
              Loob <span className="smallText">beta</span>
            </h2>
            <div className="mt-4">
              <button className="actionButton" onClick={() => proceed("introPhase")}>Start</button>
            </div>
          </motion.div>
        )}

        {/* Commenting out the Cyberdelic Showcase screen */}
        {/* {phase === "introPhase" && (
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
              <button className="actionButton" onClick={() => proceed("modalityPhase")}>Continue</button>
            </div>
          </motion.div>
        )} */}

        {phase === "modalityPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="gradientText" style={{ marginBottom: "2rem" }}>Choose your modality</h3>
            <div className="modalityContainer" style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button
                className="modalityButton voice globalButton"
                onClick={() => proceed("promptPhase")}
              >
                🎙️ Voice
              </button>
              <button
                className="modalityButton image globalButton"
                onClick={() => alert("Coming soon")}
              >
                🖼️ Image
              </button>
              <button
                className="modalityButton text globalButton"
                onClick={() => onEnter("Text Chat")}
              >
                ✍️ Chat
              </button>
              <button
                className="modalityButton wearable globalButton"
                onClick={() => alert("Coming soon")}
              >
                ⌚ Link Wearable
              </button>
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
            <h3 className="gradientText" style={{ marginBottom: "2rem" }}>Talk to me.</h3>
            <div className="buttonContainer mt-6" style={{ marginTop: "2.5rem" }}>
              <div className="recordWrapper" style={{ boxShadow: "none" }}>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  startRecording={() => console.log("Recording started")}
                />
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
