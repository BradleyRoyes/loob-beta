import React, { useState, useEffect } from "react";

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

  const modalOverlayStyle: React.CSSProperties = {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    color: "#FFFFFF",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const modalContentStyle: React.CSSProperties = {
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif",
  };

  const modalHeaderStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  };

  const modalTextStyle: React.CSSProperties = {
    fontSize: "18px",
    lineHeight: "1.8",
    padding: "20px",
    fontStyle: "italic", // Making the text italic
  };

  const buttonStyle: React.CSSProperties = {
    background: "linear-gradient(to right, #ffafbd, #ffc3a0)",
    border: "none",
    borderRadius: "4px",
    color: "#FFFFFF",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px",
    fontFamily: "'Nunito', sans-serif",
    margin: "20px",
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalHeaderStyle}>Thanks for playing</h2>
        <p style={modalTextStyle}>
          <em>{displayedText}</em>
        </p>
        <button style={buttonStyle} onClick={reloadApp}>
          new chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
