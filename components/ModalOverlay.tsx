import React, { useState, useEffect } from "react";
import { CSSProperties } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const textToType =
    "To be relevant in a living system is to generate vitality. What is that? Its relationships that build relationships that build relationships: 3rd & 4th order relational process is real systemic work. No KPI can measure it. This is #WarmData";

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex <= textToType.length) {
        setTypedText(textToType.substring(0, currentIndex));
        setCurrentIndex((prevIndex) => prevIndex + 1);
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const modalOverlayStyle: CSSProperties = {
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent black background
    color: "#FFFFFF", // White text color
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Ensures the modal is displayed above other content
  };

  const modalContentStyle: CSSProperties = {
    textAlign: "center",
  };

  const modalTextStyle: CSSProperties = {
    fontFamily: "'Nunito', sans-serif", // Global font family
    fontSize: "20px", // Increased font size
    lineHeight: "2", // Increased line height
    padding: "20px",
  };

  const buttonStyle: CSSProperties = {
    background: "linear-gradient(to left, #ac38cc, #753a88)", // Gradient similar to bubbles
    border: "none",
    borderRadius: "4px",
    color: "#FFFFFF",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px", // Global font size
    fontFamily: "'Nunito', sans-serif", // Global font family
    margin: "20px",
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <p style={modalTextStyle}>{typedText}</p>
        <button style={buttonStyle} onClick={onClose}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
