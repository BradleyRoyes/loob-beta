import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from './AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<string>("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [fadeToBlack, setFadeToBlack] = useState<boolean>(false);

  // All prompts and available prompts to avoid immediate repetition
 const allPrompts = [
  'This might be a simulation. I call a reality check — what do you do? 🌀🌀',
  'What is your dream for dream technology?',
  'You ordered coffee: quantity or quality?',
  'Do you remember the time you used an AI chatbot for the first time?',
  'Do you ever get anxious about AI?',
  'What do you think about the AI-third eye?',
  'Do you think you’ll wake up from the simulation?',
  'Ok, you woke up (from the simulation, of course). What are your first words?'
];

  
  const [availablePrompts, setAvailablePrompts] = useState([...allPrompts]);
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]);

  const getRandomPrompt = (): string => {
    if (availablePrompts.length === 0) {
      setAvailablePrompts([...usedPrompts]);
      setUsedPrompts([]);
    }
    
    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    const prompt = availablePrompts[randomIndex];
    setAvailablePrompts(availablePrompts.filter((_, index) => index !== randomIndex));
    setUsedPrompts([...usedPrompts, prompt]);
    
    return prompt;
  };

  const proceed = (nextPhase: string): void => {
    setPhase(nextPhase);
    if (nextPhase === "promptPhase") {
      setRandomPrompt(getRandomPrompt());
    }
  };

  const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 1.2, ease: "easeInOut" } },
  };

  useEffect(() => {
    if (phase === "welcomePhase") {
      // No automatic transition
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
    <motion.div
      className="splashScreen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      {/* 3D Grid Background */}
      <div className="gridBackground"></div>

      {isRecording && (
        <div className="recordingBackground">
          <div className="waveLine"></div>
          <div className="waveLine"></div>
          <div className="waveLine"></div>
        </div>
      )}
      
      {/* Welcome Phase */}
      {phase === "welcomePhase" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Welcome to</h1>
          <h1 className="gradientText">the Cyberdelic Showcase</h1>
          <button onClick={() => proceed("introPhase")}>
            Enter
          </button>
        </motion.div>
      )}

      {/* Introduction Phase */}
      {phase === "introPhase" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText" style={{ fontSize: 'normal' }}>
            I’m Loob, your guide. I help us tell new stories about new experiences. <br /><br /> Movement is everything, nothing is the goal.
          </h1>
          <button onClick={() => proceed("promptPhase")}>
            Continue
          </button>
        </motion.div>
      )}

<<<<<<< HEAD
      {phase === "zuberlin" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Today, we are imagining collective futures by looking within ourselves.</h1>
          <h2 className="gradientText">Draw a card and talk to me.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="buttonContainer">  
              <AudioRecorder
                onRecordingComplete={onRecordingComplete}
                startRecording={startRecording}
              />
              <button onClick={() => onEnter()}>
                  <b>Chat</b>
                </button>
              </div>
          </div>
        </motion.div>
      )}

      {phase === "karneval" && (
=======
      {/* Prompt Phase */}
      {phase === "promptPhase" && (
>>>>>>> f3f99fd469e918e198b9119bd6a43e1b493bf575
        <motion.div className="content" variants={variants}>
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

      {/* Fade-to-Black Overlay */}
      {fadeToBlack && (
        <div className="fadeOverlay"></div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
