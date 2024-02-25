import React, { useState, useEffect, CSSProperties } from 'react';

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const [opacity, setOpacity] = useState(0);

  // Fade-in effect for the modal overlay
  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 25);
    return () => clearTimeout(timer);
  }, []);

  // Creates floating pixels for a dynamic background effect
  useEffect(() => {
    const createFloatingPixels = () => {
      const pixel = document.createElement('div');
      pixel.className = 'floating-pixel';
      Object.assign(pixel.style, {
        width: '2px',
        height: '2px',
        background: '#FFFFFF',
        position: 'fixed',
        top: `${Math.random() * window.innerHeight}px`,
        left: `${Math.random() * window.innerWidth}px`,
      });
      document.body.appendChild(pixel);
      setTimeout(() => document.body.removeChild(pixel), 3000);
    };

    const interval = setInterval(createFloatingPixels, 100);
    return () => clearInterval(interval);
  }, []);

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
    opacity,
    transition: 'opacity 1s ease-in-out',
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
    fontSize: '14px', // Smaller font size for the quote
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
          What is that? It's relationships that build relationships that build relationships:
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
