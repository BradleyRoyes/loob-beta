import React from "react";
import { CSSProperties } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
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
    animation: "fade-in 2s ease-in-out forwards", // Trippy fade-in animation
  };

  const modalContentStyle: CSSProperties = {
    textAlign: "center",
  };

  const modalTextStyle: CSSProperties = {
    fontFamily: "'Nunito', sans-serif", // Global font family
    fontSize: "20px", // Increased font size
    lineHeight: "2.5", // Increased line height
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
        <button style={buttonStyle} onClick={onClose}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
