import React from "react";
import { CSSProperties } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const modalOverlayStyle: CSSProperties = {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    animation: "fade-in 2s ease-in-out forwards",
  };

  const modalContentStyle: CSSProperties = {
    textAlign: "center",
  };

  const modalTextStyle: CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: "18px", // Slightly smaller font size
    lineHeight: "1.8", // Reduced line height
    padding: "20px",
    animation: "fadeInText 3s ease-in-out forwards", // Text fade-in animation
    opacity: 0, // Start with text invisible
  };

  const buttonStyle: CSSProperties = {
    background: "linear-gradient(to left, #ffafbd, #ffc3a0)",
    border: "none",
    borderRadius: "4px",
    color: "#FFFFFF",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px",
    fontFamily: "'Nunito', sans-serif",
    margin: "20px",
  };

  // Function to insert line breaks every 7 words
  const insertLineBreaks = (text: string): JSX.Element => {
    const words = text.split(" ");
    const chunks = [];
    let i = 0;
    while (i < words.length) {
      chunks.push(words.slice(i, i + 7).join(" "));
      i += 7;
    }
    return (
      <>
        {chunks.map((chunk, index) => (
          <React.Fragment key={index}>
            {chunk}
            <br />
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <p style={modalTextStyle}>{insertLineBreaks("To be relevant in a living system is to generate vitality. What is that? Its relationships that build relationships that build relationships: 3rd & 4th order relational process is real systemic work. No KPI can measure it. This is #WarmData")}</p>
        <button
          style={buttonStyle}
          onClick={() => window.location.reload()} // Reloads the entire app
        >
          new chat
        </button>
      </div>
    </div>
  );
};

// Add keyframes for the fade-in effect
const globalStyle: CSSProperties = {
  "@global": {
    "@keyframes fadeInText": {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    "@keyframes fade-in": {
      "0%": { opacity: 0 },
      "100%": { opacity: 1 },
    },
  },
};

export default ModalOverlay;
