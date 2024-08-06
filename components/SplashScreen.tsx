import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from './AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState<string>("welcome");
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false); // State to track if recording is active

  const prompts = [
    'When was the last time you felt speechless? Tell me about it.',
    'Karneval has celebrated diversity for many years. What message do you want to send to the Karneval-goers 200 years from now?',
    'When was the last time you felt completely enchanted by something? Tell me about it.',
    'Imagine me, Loob, as a time capsule. What key piece of today’s culture do you think should be preserved for future generations?',
    'Tell me about an experience where you felt a deep sense of gratitude and appreciation for the simple things in life.',
    'Share a time when you were moved to tears by an act of kindness, generosity, or compassion.',
    'Have you ever encountered a new idea or concept that challenged your existing beliefs and prompted you to reevaluate your worldview?',
    'Share a time when you were awestruck by the power of nature.',
    'Describe a time when you felt a deep sense of connection with a place, culture, or tradition that was new to you.',
    'Have you had an unexpected encounter with a stranger at Karneval that left you with a feeling of curiosity? Tell me about it.',
    'Has there been a moment at Karneval when you felt a deep connection to something greater than yourself? Tell me about it.'
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
  };

  useEffect(() => {
    if (phase === "welcome") {
      // Removed the automatic transition to "learnMore" phase
    }
  }, [phase]);

  const onRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false); // Stop animation when recording is complete
  
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm"); // Use the Blob directly
  
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
  
      onEnter(data.transcription);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const startRecording = () => {
    setIsRecording(true); // Start animation when recording starts
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

      {phase === "introduction" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText" style={{ fontSize: 'normal' }}>
         I’m loob, a listener. An urban story container to help us tell new stories about new experiences. <br/> <br/> Movement is everything, nothing is the goal.  
          </h1>
          <button onClick={() => proceed("opendecks")}>
            Continue
          </button>
        </motion.div>
      )}

       {phase === "opendecks" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">This is a moment for you. A moment of reflection. This reflection will join the collective canvas.</h1>
          <h2 className="gradientText">What would you like to remember about tonight?</h2>
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


      {phase === "zuberlin" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">This is a moment for you. A moment of reflection. This reflection will be a part of a collective canvas.</h1>
          <h2 className="gradientText">What would you like to remember about tonight?</h2>
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

      {phase === "learnMore" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Would you like to</h1>
          <button onClick={() => onEnter("I would like to talk about my night with you.")}>
            Share about your night
          </button>
          <h3 className="gradientText" style={{ fontSize: 'normal' }}><br/>or learn more about</h3>
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

      {phase === "feedback" && (
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
          <button onClick={() => onEnter("I'd like to share feedback on you. Loob AI")}>
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
