import React, { useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css"; // Ensure this contains the updated styles as provided below

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
          <button onClick={() => proceed("location")}>Continue</button>
        </motion.div>
      )}

      {phase === "location" && (
        <motion.div className="content" variants={variants}>
          <p>Where are you?</p>
          <button onClick={() => proceed("action")}>MOOS Space Berlin</button>
          <button onClick={() => onEnter()}>At the Club</button>
          <button onClick={() => onEnter()}>At Home</button>
        </motion.div>
      )}

      {phase === "action" && (
        <motion.div className="content" variants={variants}>
          <p>What would you like to do?</p>
          <button onClick={() => onEnter("Share an experience")}>
            I&apos;d like to share an experience
          </button>
          <button onClick={() => onEnter("Host at MOOS")}>
            I&apos;d like to host at MOOS
          </button>
          <button onClick={() => onEnter("Visit MOOS")}>
            I&apos;d like to visit MOOS
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;
