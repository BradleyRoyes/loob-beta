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
            enter
          </button>
        </motion.div>
      )}

      {phase === "introduction" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText" style={{ fontSize: 'smaller' }}>hi, I&apos;m Loob, <br/> an AI-in-training being built to one day make events like this one a little more interesting. <br/> Tonight is my very first gig! <br/> it would be great if you would take a moment to chat with me and share an experience you've had at MOOS. Perhaps an event that really moved you, or even something that bugged you that happened here. Everything you share with me is completely anonymous.    </h1>
          <button onClick={() => proceed("learnMore")}>
            Continue
          </button>
        </motion.div>
      )}
      
      {phase === "learnMore" && (
      
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">So, would you like to:</h1>
          <button onClick={() => onEnter("I would like to share an experience with you.")}>
            Share an Experience
          </button>
          <button onClick={() => onEnter("Tell me about MOOS.")}>
            Learn about MOOS
          </button>
          <button onClick={() => onEnter("Tell me about EDS and EDS001.")}>
            Learn about EDS
          </button>
         
          <button onClick={() => onEnter("can we talk about harm reduction?")}>
            Talk Harm Reduction
          </button>
          <button onClick={() => proceed("feedback")}>
            I&apos;d like to share specific feedback
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
