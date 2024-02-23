import React, { useState, useEffect, CSSProperties } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 25); // Adjusted for faster fade-in
    return () => clearTimeout(timer);
  }, []);

  const modalOverlayStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    background: "rgba(0,0,0,0.9)",
    backdropFilter: "blur(5px)",
    opacity: opacity,
    transition: "opacity 1s ease-in-out",
  };

  const modalContentStyle: CSSProperties = {
    textAlign: "center",
    zIndex: 20,
    position: "relative",
    color: "#FFFFFF",
    fontFamily: "'Nunito', sans-serif",
    padding: "20px",
  };

  const headerStyle: CSSProperties = {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  };

  const quoteStyle: CSSProperties = {
    fontStyle: "italic",
    padding: "10px 10px",
  };

  const buttonStyle: CSSProperties = {
    background: "linear-gradient(to right, #FF6B6B, #FFA36B)",
    border: "none",
    borderRadius: "4px",
    color: "#FFFFFF",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Nunito', sans-serif",
    margin: "20px",
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>Thanks for playing</div>
        <p style={quoteStyle}>
          To be relevant in a living system is to generate vitality. What is that? <br/> Its relationships that build relationships that build relationships:<br/> 3rd & 4th order relational process is real systemic work. <br/> No KPI can measure it. This is #WarmData
        </p>
        <button style={buttonStyle} onClick={reloadApp}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
