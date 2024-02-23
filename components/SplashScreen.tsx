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
      const timer = setTimeout(() => {
        proceed("learnMore");
      }, 3000); // Adjust the duration as needed

      return () => clearTimeout(timer); // Cleanup the timer
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
        </motion.div>
      )}

      {phase === "learnMore" && (
        <motion.div className="content" variants={variants}>
          <button onClick={() => onEnter("I'd like to Learn More about MOOS")}>
            I&apos;sd like to Learn More about MOOS
          </button>
          <button onClick={() => onEnter("I'd like to Learn more about EDS")}>
            I&apos;sd like to Learn more about EDS
          </button>
          <button onClick={() => proceed("feedback")}>
            I&apos;sd like to Share some feedback
          </button>
        </motion.div>
      )}

      {phase === "feedback" && (
        <motion.div className="content" variants={variants}>
          <button onClick={() => onEnter("I'd like to share feedback on the Twisttea bar")}>
            I&apos;sd Like to Share feedback on the Twisttea bar
          </button>
          <button onClick={() => onEnter("I'd like to Share feedback on the LoobLab")}>
            I&apos;sd Like to Share feedback on the LoobLab
          </button>
          <button onClick={() => onEnter("I'd like to Share feedback on the Sound Sauna")}>
            I&apos;sd Like to Share feedback on the Sound Sauna
          </button>
          <button onClick={() => onEnter("I'd like to Share feedback on the Aroma Space")}>
            I&apos;sd Like to Share feedback on the Aroma Space
          </button>
          <button onClick={() => onEnter("I'd like to talk about something else")}>
            I&apos;sd like to talk about something else
          </button>
        </motion.div>
      )}

      {/* Ensure other phases are handled as they were, without introducing new functionality or variables */}
    </motion.div>
  );
};

export default SplashScreen;
