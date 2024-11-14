import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from './AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<string>("welcomePhase");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Updated list of prompts
  const prompts = [
    'What truth do you find in silence?',
    'Where does wonder take you?',
    'What sound calls you home?',
    'What would you see if you closed your eyes?',
    'How does the unknown feel?',
    'What part of you waits to be discovered?',
    'What awakens your awe?',
    'What memory feels like magic?',
    'What colors live in your dreams?',
    'When did time last stand still?',
    'What pulls you toward mystery?'
  ];

  const getRandomPrompt = (): string => {
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const proceed = (nextPhase: string): void => {
    setPhase(nextPhase);
    if (nextPhase === "promptPhase") {
      setRandomPrompt(getRandomPrompt());
    }
  };

  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } },
    exit: { opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  };

  useEffect(() => {
    if (phase === "welcomePhase") {
      // Removed the automatic transition to "infoPhase"
    }
  }, [phase]);

  const onRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false);

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
          <button onClick={() => proceed("experienceSelectorPhase")}>
            Continue
          </button>
        </motion.div>
      )}

      {/* Experience Selector Phase */}
      {phase === "experienceSelectorPhase" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">I am here to help you choose your experience</h1>
          <h2 className="gradientText">Would you prefer something more passive and relaxing, or intense and engaging?</h2>
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

      {/* Information Gathering Phase */}
      {phase === "infoGatheringPhase" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Welcome to Cyberdelic Showcase at Gamesground 2024. To help me choose an experience for you, please first tell me...</h1>
          <h2 className="gradientText">Are you looking for something more passive and relaxing, or something quite engaged and intense?</h2>
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

      {/* Prompt Phase */}
      {phase === "promptPhase" && (
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

      {/* Learn More Phase */}
      {phase === "learnMorePhase" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Would you like to</h1>
          <button onClick={() => onEnter("I would like to talk about my night with you.")}>
            Share about your night
          </button>
          <h3 className="gradientText" style={{ fontSize: 'normal' }}><br />or learn more about</h3>
          <div className="buttonContainer">
            <button className="smallButton" onClick={() => onEnter("Tell me about MOOS.")}>
              MOOS
            </button>
            <button className="smallButton" onClick={() => onEnter("Tell me about EDS and seks/loob.")}>
              EDS
            </button>
            <button className="smallButton" onClick={() => onEnter("I am having a difficult time, can you give me harm reduction support")}>
              Harm Reduction
            </button>
          </div>
        </motion.div>
      )}

      {/* Feedback Phase */}
      {phase === "feedbackPhase" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">I&apos;d like to share feedback on</h1>
          <button onClick={() => onEnter("I'd like to share some feedback on MOOS")}>
            MOOS as a community
          </button>
          <button onClick={() => onEnter("I'd like to share feedback on the TwistTea bar")}>
            TwistTea bar
          </button>
          <button onClick={() => onEnter("I'd like to share feedback on AromaAlchemy space")}>
            AromaAlchemy
          </button>
          <button onClick={() => onEnter("I'd like to share feedback on the SoundSauna")}>
            SoundSauna
          </button>
          <button onClick={() => onEnter("I'd like to share feedback on you, Loob AI")}>
            you, Loob AI
          </button>
          <button onClick={() => onEnter("I'd like to talk about something else")}>
            something else
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
