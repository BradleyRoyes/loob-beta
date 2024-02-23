import React, { useState, useEffect } from "react";
import { ReactP5Wrapper } from "react-p5-wrapper";
import NodeBackground from "./NodeBackground"; // Ensure this path matches where you save NodeBackground.js

const ModalOverlay = ({ onClose }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(timer);
  }, []);

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  };

  const modalContentStyle = {
    textAlign: "center",
    zIndex: 20, // Ensure modal content is above the canvas
    position: "relative",
    color: "#FFFFFF",
    fontFamily: "'Nunito', sans-serif",
    padding: "20px",
    opacity: opacity,
    transition: "opacity 3s ease-in-out",
  };

  const buttonStyle = {
    background: "linear-gradient(to right, #FF6B6B, #FFA36B)",
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
      <ReactP5Wrapper sketch={NodeBackground} />
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <p>
          To be relevant in a living system is to generate vitality. <br />What is that? <br /> Its relationships that build relationships that build relationships: <br />3rd & 4th order relational process is real systemic work. <br />No KPI can measure it. <br />This is #WarmData
        </p>
        <button style={buttonStyle} onClick={reloadApp}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
