import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";
import AudioRecorder from '../components/AudioRecorder';

const SplashScreen: React.FC<{ onEnter: (prompt?: string) => void }> = ({
  onEnter,
}) => {
  const [phase, setPhase] = useState("welcome");

  const proceed = (nextPhase: string) => {
    setPhase(nextPhase);
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
  
  const onRecordingComplete = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav"); // 'audio' is the field name expected by the server

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription:', data.transcription); // Log the transcription to the console

      // Proceed to chat page with the transcription text
      onEnter(data.transcription);
    } catch (error) {
      console.error('Error uploading audio:', error);
      // Handle the error state appropriately, maybe show a message to the user
    }
  };

  return (
    <motion.div
      className="splashScreen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
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
          <button onClick={() => proceed("karneval")}>
            Continue
          </button>
        </motion.div>
      )}

      {phase === "karneval" && (
            
            <motion.div className="content" variants={variants}>
              <h1 className="gradientText">Today</h1>
              <h1 className="gradientText">we are reimagining</h1>
              <h1 className="gradientText">the future of Karneval</h1>
              <h1 className="gradientText">so tell me</h1>
              <h1 className="gradientText">What's preventing you from celebrating?</h1>
              <AudioRecorder onRecordingComplete={onRecordingComplete} />
              {/* Button to skip recording and go directly to chat */}
              <button onClick={() => onEnter()}>Chat</button>
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

      {/* Ensure other phases are handled as they were, without introducing new functionality or variables */}
    </motion.div>
  );
};

export default SplashScreen;
