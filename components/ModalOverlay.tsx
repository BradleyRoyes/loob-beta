import React from "react";

const ModalOverlay = ({ onClose, theme }: { onClose: () => void; theme: string }) => {
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Set a high z-index value
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: theme === "dark" ? "#232324" : "white",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    maxWidth: "80%",
  };

  const modalTextStyle: React.CSSProperties = {
    fontSize: "16px",
    lineHeight: "1.5",
    marginBottom: "20px",
    color: theme === "dark" ? "#FFFFFF" : "#090909",
  };

  const modalButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: theme === "dark" ? "#9946B9" : "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundImage: theme === "dark" ? "linear-gradient(to right, #9946B9, #753a88)" : "linear-gradient(to right, #007bff, #0056b3)",
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <p style={modalTextStyle}>
          To be relevant in a living system is to generate vitality. What is
          that? Its relationships that build relationships that build
          relationships: 3rd & 4th order relational process is real systemic
          work. No KPI can measure it. This is #WarmData
        </p>
        <button style={modalButtonStyle} onClick={onClose}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
