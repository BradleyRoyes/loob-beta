import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useGlobalState } from "./GlobalStateContext";
import "./SplashScreen.css";
import AudioRecorder from "./AudioRecorder";

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const { setSessionId, setUserId } = useGlobalState();
  const [phase, setPhase] = useState<
    "welcomePhase" | "introPhase" | "modalityPhase" | "promptPhase"
  >("welcomePhase");
  const [username, setUsername] = useState<string>("");
  const [fadeToBlack, setFadeToBlack] = useState<boolean>(false);

  const proceed = useCallback(
    (nextPhase: "welcomePhase" | "introPhase" | "modalityPhase" | "promptPhase") => {
      setPhase(nextPhase);
    },
    []
  );

  useEffect(() => {
    if (phase === "introPhase") {
      proceed("modalityPhase");
    }
  }, [phase, proceed]);

  const handleLogin = () => {
    if (username.trim()) {
      setUserId(username);
      setSessionId(username); // Use username as session ID
      proceed("introPhase");
    } else {
      alert("Please enter a pseudonym.");
    }
  };

  const handleTapChip = () => {
    alert("Tap chip functionality coming soon.");
    setUserId("TapChipUser");
    setSessionId("TapChipSession");
    proceed("introPhase");
  };

  const handleStayAnonymous = () => {
    const randomId = `anon-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(null);
    setSessionId(randomId);
    proceed("introPhase");
  };

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
    <div className="splashScreen" style={{ padding: "3rem", background: "radial-gradient(circle, #1a1a1a, #000)", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      {/* 3D Grid Background */}
      <div className="gridBackground"></div>

      <div className="content" style={{ padding: "1.5rem", textAlign: "center" }}>
        {phase === "welcomePhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
            style={{ maxWidth: "400px", width: "100%" }}
          >
            <h2 className="gradientText biggerText" style={{ color: "#fff", marginBottom: "1.5rem" }}>
              Loob <span className="smallText" style={{ fontSize: "1rem", opacity: 0.8 }}>beta</span>
            </h2>
            <div className="mt-4" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Enter pseudonym"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pseudonymInput"
                style={{
                  padding: "0.8rem",
                  fontSize: "1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  maxWidth: "300px",
                  background: "#333",
                  color: "#fff",
                  textAlign: "center",
                }}
              />
              <button className="actionButton" onClick={handleLogin} style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#ff7b00", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
                Log In
              </button>
              <button
                className="actionButton"
                onClick={handleTapChip}
                style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#ff7b00", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                Tap Chip
              </button>
              <button
                className="actionButton"
                onClick={handleStayAnonymous}
                style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#ff7b00", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                Stay Anonymous
              </button>
            </div>
          </motion.div>
        )}

        {phase === "modalityPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="gradientText" style={{ marginBottom: "2rem", color: "#fff" }}>
              Choose your modality
            </h3>
            <div
              className="modalityContainer"
              style={{ display: "flex", justifyContent: "center", gap: "1rem" }}
            >
              <button
                className="modalityButton voice globalButton"
                onClick={() => proceed("promptPhase")}
                style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#ff7b00", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                🎙️ Voice
              </button>
              <button
                className="modalityButton image globalButton"
                onClick={() => alert("Coming soon")}
                style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#666", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                🖼️ Image
              </button>
              <button
                className="modalityButton text globalButton"
                onClick={() => onEnter("Text Chat")}
                style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#666", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
              >
                ✍️ Chat
              </button>
              <button
                className="modalityButton wearable globalButton"
                onClick={() => alert("Coming soon")}
                style={{ padding: "0.8rem 1.5rem", fontSize: "1rem", backgroundColor: "#666", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
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
            <h3 className="gradientText" style={{ marginBottom: "2rem", color: "#fff" }}>
              Talk to me.
            </h3>
            <div
              className="buttonContainer mt-6"
              style={{ marginTop: "2.5rem" }}
            >
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
