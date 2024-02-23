import React, { useState, useEffect } from "react";
import styles from "../app/ModalOverlay.module.css";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const words = addLineBreaks(
      "To be relevant in a living system is to generate vitality. What is that? Its relationships that build relationships that build relationships: 3rd & 4th order relational process is real systemic work. No KPI can measure it. This is #WarmData."
    );
    const timer = setInterval(() => {
      if (wordIndex < words.length) {
        setDisplayedText((prevText) => prevText + " " + words[wordIndex]);
        setWordIndex((prevIndex) => prevIndex + 1);
      } else {
        clearInterval(timer);
      }
    }, 100); // Adjust the interval to control the speed of the transition
    return () => clearInterval(timer);
  }, [wordIndex]);

  const addLineBreaks = (text: string) => {
    const words = text.split(" ");
    const result: string[] = [];
    for (let i = 0; i < words.length; i += 6) {
      result.push(words.slice(i, i + 6).join(" "));
    }
    return result;
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalHeader}>Thanks for playing</h2>
        <p className={styles.modalText}>
          <em>{displayedText}</em>
        </p>
        <button className={styles.button} onClick={reloadApp}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
