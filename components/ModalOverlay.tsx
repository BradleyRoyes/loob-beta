// ModalOverlay.tsx
import React from "react";

const ModalOverlay = ({ onClose }) => {
  return (
    <div className="modal-overlay">
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