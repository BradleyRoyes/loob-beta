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
          <button onClick={() => proceed("learnMore")}>
            chat with me
          </button>
        </motion.div>
      )}

      {phase === "introduction" && (
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText" style={{ fontSize: 'smaller' }}>hi, I&apos;m Loob, an AI in training being built to one day make events like this one a little more interesting. tonight is my very first gig! you can chat with me to learn more about MOOS, EDS, harm reduction, and to leave feedback. </h1>
          <button onClick={() => proceed("learnMore")}>
            continue
          </button>
        </motion.div>
      )}
      
      {phase === "learnMore" && (
      
        <motion.div className="content" variants={variants}>
          <h1 className="gradientText">alright Loob, tell me more about</h1>
          <button onClick={() => onEnter("Tell me about EDS")}>
            EDS
          </button>
          <button onClick={() => onEnter("Tell me about MOOS")}>
            MOOS
          </button>
          <button onClick={() => proceed("feedback")}>
            I&apos;d like to share anonymous feedback
          </button>
          <button onClick={() => onEnter("can we talk about harm reduction?")}>
            harm reduction
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
