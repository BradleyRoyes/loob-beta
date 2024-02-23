import React from "react";

const ModalOverlay = ({ onClose }: { onClose: () => void }) => {
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    maxWidth: "80%",
  };

  const modalTextStyle: React.CSSProperties = {
    fontSize: "16px",
    lineHeight: "1.5",
    marginBottom: "20px",
  };

  const modalButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
