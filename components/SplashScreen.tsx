import React, { useEffect, useRef, useState } from "react"; // Add useEffect here
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

  // Automatically proceed from the welcome phase after a delay
  useEffect(() => {
    if (phase === "welcome") {
      const timer = setTimeout(() => {
        proceed("location");
      }, 3000); // Adjust the duration as needed, 3000ms = 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [phase, proceed]);

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
          {/* Button removed, will automatically proceed */}
        </motion.div>
      )}

      {phase === "location" && (
        <motion.div className="content" variants={variants}>
          <p>Where are you?</p>
          <button onClick={() => proceed("moos")}>MOOS Space Berlin</button>
          <button onClick={() => proceed("club")}>At the Club</button>
          <button onClick={() => proceed("home")}>At Home</button>
        </motion.div>
      )}

      {phase === "moos" && (
        <motion.div className="content" variants={variants}>
          <p>What would you like to do?</p>
          <button
            onClick={() =>
              onEnter("I'd like to share an experience I'm having at MOOS")
            }
          >
            I&apos;d like to share an experience
          </button>
          <button onClick={() => onEnter("I want to learn more about MOOS")}>
            I&apos;d like to host at MOOS
          </button>
          <button onClick={() => onEnter("What's happening at MOOS this week?")}>
            I&apos;d like to visit MOOS
          </button>
        </motion.div>
      )}

      {phase === "club" && (
        <motion.div className="content" variants={variants}>
          <p>What would you like to do?</p>
          <button onClick={() => onEnter("I'd like to share an experience")}>
            I&apos;d like to share an experience
          </button>
          <button onClick={() => onEnter("I'm having a difficult time")}>
            I&apos;m having a difficult time
          </button>
        </motion.div>
      )}

      {phase === "home" && (
        <motion.div className="content" variants={variants}>
          <p>What would you like to do?</p>
          <button onClick={() => onEnter("I'd like to share an experience")}>
            I&apos;d like to share an experience
          </button>
          <button onClick={() => onEnter("I want to journal")}>
            I want to journal
          </button>
          <button onClick={() => onEnter("I'm having a difficult time")}>
            I&apos;m having a difficult time
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SplashScreen;