import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";

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
            Hi, I&apos;m Loob, an AI in training being built to one day make events like this one a little more interesting. <br/> You can chat with me to learn more about MOOS, EDS, harm reduction, and to share an experience. <br/> I would love it if you would share with me an experience you have had at MOOS. Anything is fine. Everything you share is anonymous. 
          </h1>
          <button onClick={() => proceed("learnMore")}>
            Continue
          </button>
        </motion.div>
      )}


      {phase === "learnMore" && (
      
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">Would you like to</h1>
          <button onClick={() => onEnter("I would like to share an experience I am having with you.")}>
            Share an Experience
          </button>
          <button onClick={() => onEnter("Tell me about MOOS.")}>
            Learn about MOOS
          </button>
          <button onClick={() => onEnter("Tell me about EDS and seks/loob.")}>
            Learn about EDS
          </button>
         
          <button onClick={() => onEnter("I am having a difficult time, can you give me harm reduction support")}>
            Harm Reduction
          </button>
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

