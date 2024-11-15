import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from './AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<string>("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [fadeToBlack, setFadeToBlack] = useState<boolean>(false);

  // All prompts and available prompts to avoid immediate repetition
  const allPrompts = [
    'What, if anything, does "cyberdelic" mean to you?',
    'What brought you down to the dungeon today?',
    'When you order coffee: quantity or quality?',
    'What is the best part about going on vacation?',
    'What would you like to have happen after you die?',
    'You wake up to realize your whole life was a dream, what are your first words?',
    'Where in your body would you say you "live" (i.e. shoulders, hands, belly,)?',
  ];

  const [availablePrompts, setAvailablePrompts] = useState([...allPrompts]);
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]);

  const getRandomPrompt = (): string => {
    if (availablePrompts.length === 1) {
      setAvailablePrompts([...usedPrompts]);
      setUsedPrompts([]);
    }

    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    const prompt = availablePrompts[randomIndex];
    setAvailablePrompts(prevPrompts => prevPrompts.filter((_, index) => index !== randomIndex));
    setUsedPrompts(prevUsedPrompts => [...prevUsedPrompts, prompt]);

    return prompt;
  };

  const proceed = (nextPhase: string): void => {
    setPhase(nextPhase);
    if (nextPhase === "promptPhase") {
      setRandomPrompt(getRandomPrompt());
    }
  };

  useEffect(() => {
    if (phase === "introPhase") {
      const timer = setTimeout(() => proceed("promptPhase"), 5000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const onRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false);
    setFadeToBlack(true);

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
      onEnter(data.transcription);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setFadeToBlack(false);
  };

  return (
    <div className="splashScreen">
      {/* 3D Grid Background */}
      <div className="gridBackground"></div>

      {isRecording && (
        <div className="recordingBackground">
          <div className="waveLine"></div>
          <div className="waveLine"></div>
          <div className="waveLine"></div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Welcome Phase */}
        {phase === "welcomePhase" && (
          <div className="content">
            <h1 className="gradientText">Welcome to</h1>
            <h2 className="gradientText">Cyberdelic Nexus Berlin</h2>
            <button onClick={() => proceed("introPhase")}>
              Enter
            </button>
          </div>
        )}

        {/* Introduction Phase with Fade-In/Fade-Out */}
        {phase === "introPhase" && (
          <motion.div
            className="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 2 } }}
            exit={{ opacity: 0, transition: { duration: 2 } }}
          >
            <h1 className="gradientText" style={{ fontSize: 'normal' }}>
              I’m Loob, your guide. <br/><br /> I help tell stories that are hard to tell. <br/><br /> Movement is everything, nothing is the goal.
            </h1>
          </motion.div>
        )}

        {/* Prompt Phase */}
        {phase === "promptPhase" && (
          <div className="content">
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
          </div>
        )}
      </AnimatePresence>

      {/* Fade-to-Black Overlay */}
      {fadeToBlack && (
        <div className="fadeOverlay"></div>
      )}
    </div>
  );
};

export default SplashScreen;
