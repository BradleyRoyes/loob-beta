import React from "react";

const ModalOverlay = ({ onClose, theme }) => {
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const modalContentStyle = {
    backgroundColor: theme === "dark" ? "#232324" : "#FFFFFF",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "80%",
    textAlign: "center",
    color: theme === "dark" ? "#FFFFFF" : "#090909",
    fontFamily: "'Nunito', sans-serif",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "5px",
    backgroundColor: theme === "dark" ? "#ffffff" : "#000000",
    color: theme === "dark" ? "#000000" : "#ffffff",
    border: "none",
    cursor: "pointer",
    marginTop: "20px",
    transition: "background-color 0.3s, color 0.3s",
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <p>
          To be relevant in a living system is to generate vitality. What is
          that? Its relationships that build relationships that build
          relationships: 3rd & 4th order relational process is real systemic
          work. No KPI can measure it. This is #WarmData
        </p>
        <button style={buttonStyle} onClick={onClose}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
