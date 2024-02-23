import React from "react";

const ModalOverlay = ({ onClose }) => {
  const modalOverlayStyle = {
    backgroundColor: "black",
    color: "white",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Ensure it overlays everything else
  };

  return (
    <div style={modalOverlayStyle}>
      <div className="modal-content">
        <p>
          To be relevant in a living system is to generate vitality. What is
          that? Its relationships that build relationships that build
          relationships: 3rd & 4th order relational process is real systemic
          work. No KPI can measure it. This is #WarmData
        </p>
        <button onClick={onClose}>New Chat</button>
      </div>
    </div>
  );
};

export default ModalOverlay;
