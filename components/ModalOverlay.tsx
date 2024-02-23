import React, { useState, useEffect, CSSProperties } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  // State for managing opacity
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Gradually change opacity to 1 to achieve the fade-in effect
    const timer = setTimeout(() => setOpacity(1), 100); // Start fade-in after 100ms
    return () => clearTimeout(timer); // Clean up timeout
  }, []); // Empty dependency array means this effect runs once on mount

  const modalOverlayStyle: CSSProperties = {
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

  const modalContentStyle: CSSProperties = {
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif",
  };

  const modalTextStyle: CSSProperties = {
    fontSize: "18px",
    lineHeight: "1.8",
    padding: "20px",
    opacity: opacity, // Apply dynamic opacity
    transition: "opacity 3s ease-in-out", // Smooth transition for the opacity
    fontStyle: "italic", // Making the text italic
  };

  const buttonStyle: CSSProperties = {
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

  // Function to add line breaks every 6 words and fade in text line by line
  const addLineBreaksAndFadeIn = (text: string) => {
    const words = text.split(' ');
    const result: JSX.Element[] = [];
    words.forEach((word, index) => {
      const delay = index * 100; // Adjust the delay time as needed
      result.push(
        <span key={index} style={{ opacity: 0, transition: `opacity 1s ease-in-out ${delay}ms`, display: "inline-block" }}>
          {word} {index % 6 === 5 && <br />} {/* Add line break after every 6 words */}
        </span>
      );
    });
    return result;
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <p style={modalTextStyle}>
          {addLineBreaksAndFadeIn("To be relevant in a living system is to generate vitality. What is that? Its relationships that build relationships that build relationships: 3rd & 4th order relational process is real systemic work. No KPI can measure it. This is #WarmData.")}
        </p>
        <button style={buttonStyle} onClick={reloadApp}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
