import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from './AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<string>("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [fadeToBlack, setFadeToBlack] = useState<boolean>(false);

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
      const timer = setTimeout(() => proceed("promptPhase"), 4000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setFadeToBlack(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "audio/webm");

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

  return (
    <div className="splashScreen">
      {/* 3D Grid Background */}
      <div className="gridBackground"></div>

      <div className="content">
        {phase === "welcomePhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="gradientText biggerText">Hi.</h1>
            <h2 className="gradientText biggerText">Care for an adventure?</h2>
            <button className="actionButton" onClick={() => proceed("introPhase")}>Enter</button>
          </motion.div>
        )}

        {phase === "introPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="gradientText">
              I’m Loob, your guide. <br /><br /> I help tell stories that are hard to tell. <br /><br /> Movement is everything, nothing is the goal.
            </h1>
            <button className="actionButton" onClick={() => proceed("promptPhase")}>Continue</button>
          </motion.div>
        )}

        {phase === "promptPhase" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="gradientText">Tell me...</h3>
            <h2 className="gradientText">{randomPrompt}</h2>
            <div className="buttonContainer">
              <div className="recordWrapper">
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  startRecording={() => console.log('Recording started')}
                />
                <button className="newPromptButton" onClick={() => setRandomPrompt(getRandomPrompt())}>
                  New Prompt
                </button>
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
          transition={{ duration: 1.5 }} // Slow smooth fade
        ></motion.div>
      )}
    </div>
  );
};

export default SplashScreen;
