import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from './AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<string>("welcome");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showFade, setShowFade] = useState<boolean>(false); // New state for fade-out

  const prompts = [
    'When was the last time you felt speechless? Tell me about it.',
    'Karneval has celebrated diversity for many years. What message do you want to send to the Karneval-goers 200 years from now?',
    // Add more prompts as needed
  ];

  const getRandomPrompt = (): string => {
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const proceed = (nextPhase: string): void => {
    setPhase(nextPhase);
    if (nextPhase === "karneval") {
      setRandomPrompt(getRandomPrompt());
    }
  };

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } },
    exit: { opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } },
    fadeOut: { opacity: 0, filter: "blur(4px)", transition: { duration: 1.2 } } // New fade-out effect
  };

  useEffect(() => {
    if (phase === "welcome") {
      // Handle the welcome phase if needed
    }
  }, [phase]);

  const onRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false);
    setShowFade(true); // Trigger the fade-out effect

    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription:', data.transcription);

      // Delay proceeding to allow fade animation to complete
      setTimeout(() => onEnter(data.transcription), 1200); 
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setShowFade(false); // Reset the fade-out effect when starting a new recording
  };

  return (
    <motion.div
      className="splashScreen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      {isRecording && (
        <div className="recordingBackground">
          <div className="waveLine"></div>
          <div className="waveLine"></div>
          <div className="waveLine"></div>
        </div>
      )}
      {phase === "welcome" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Welcome to Loob</h1>
          <button onClick={() => proceed("introduction")}>
            Enter
          </button>
        </motion.div>
      )}

      {/* Other phases go here */}

      {phase === "karneval" && (
        <motion.div className={`content ${showFade ? "fade" : ""}`} variants={showFade ? variants.fadeOut : variants}>
          <h2 className="gradientText">{randomPrompt}</h2>
          <div className="buttonContainer">
            <AudioRecorder
              onRecordingComplete={onRecordingComplete}
              startRecording={startRecording}
            />
            <button className="newPromptButton" onClick={() => setRandomPrompt(getRandomPrompt())}>
              New Prompt
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
