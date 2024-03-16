import React, { useState, useEffect, CSSProperties } from 'react';

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  // Styles
  const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    background: 'rgba(0,0,0,1)',
    backdropFilter: 'blur(5px)',
    opacity: 1,
  };

  const modalContentStyle: CSSProperties = {
    textAlign: 'center',
    zIndex: 20,
    position: 'relative',
    color: '#FFFFFF',
    fontFamily: "'Nunito', sans-serif",
    padding: '20px',
    backgroundColor: '#000', // Ensures modal content has a black background
  };

  const quoteStyle: CSSProperties = {
    fontStyle: 'italic',
    fontSize: '16px', // Smaller font size for the quote
    color: '#FFFFFF', // White text color
    backgroundColor: '#000', // Black background color
    padding: '10px',
  };

  const buttonStyle: CSSProperties = {
    background: 'linear-gradient(to right, #FF6B6B, #FFA36B)',
    border: 'none',
    borderRadius: '4px',
    color: '#FFFFFF',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: "'Nunito', sans-serif",
    marginTop: '20px', // Adjusted for better spacing
  };

  // Function to reload the application
  const reloadApp = () => {
    window.location.reload();
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          Thanks for Chatting
        </h2>
        <p style={quoteStyle}>
          To be relevant in a living system is to generate vitality.
          <br />
          What is that? Its relationships that build relationships that build relationships:
          <br />
          3rd & 4th order relational process is real systemic work.
          <br />
          No KPI can measure it. This is #WarmData.
        </p>
        <button style={buttonStyle} onClick={reloadApp}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
