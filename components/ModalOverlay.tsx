import React, { useState, useEffect, CSSProperties } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  // State for managing opacity
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Gradually change opacity to 1 to achieve the fade-in effect
    const timer = setTimeout(() => setOpacity(1), 50); // Start fade-in after 100ms
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

  const modalHeaderStyle: CSSProperties = {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  };

  const modalTextStyle: CSSProperties = {
    fontSize: "18px",
    lineHeight: "1.8",
    padding: "20px",
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

  // Function to add line breaks every 6 words
  const addLineBreaks = (text: string) => {
    const words = text.split(' ');
    const result: JSX.Element[] = [];
    for (let i = 0; i < words.length; i += 6) {
      result.push(
        <span key={i}>
          {words.slice(i, i + 6).join(' ')}
          <br />
        </span>
      );
    }
    return result;
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalHeaderStyle}>Thanks for playing</h2>
        <p style={modalTextStyle}>
          <em>
            {addLineBreaks("To be relevant in a living system is to generate vitality. What is that? Its relationships that build relationships that build relationships: 3rd & 4th order relational process is real systemic work. No KPI can measure it. This is #WarmData.")}
          </em>
        </p>
        <button style={buttonStyle} onClick={reloadApp}>
          new chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
