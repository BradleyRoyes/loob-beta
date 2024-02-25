import React, { useState, useEffect } from "react";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 25); // Adjusted for faster fade-in
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const createFloatingPixels = () => {
      const pixel = document.createElement("div");
      pixel.classList.add("floating-pixel");
      pixel.style.width = "2px";
      pixel.style.height = "2px";
      pixel.style.background = "#FFFFFF";
      pixel.style.position = "fixed";
      pixel.style.top = `${Math.random() * window.innerHeight}px`;
      pixel.style.left = `${Math.random() * window.innerWidth}px`;
      document.body.appendChild(pixel);

      setTimeout(() => {
        document.body.removeChild(pixel);
      }, 3000);
    };

    const interval = setInterval(createFloatingPixels, 100);

    // Cleanup function to trigger pixels on close
    return () => {
      clearInterval(interval);
      for (let i = 0; i < 10; i++) {
        createFloatingPixels();
      }
    };
  }, []);

  const modalOverlayStyle = {
    position: "fixed" as "fixed", // Explicitly cast the string as a CSS property value
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex" as "flex", // This is usually not necessary, but added for consistency
    flexDirection: "column" as "column",
    justifyContent: "center" as "center", // This casting is usually not necessary
    alignItems: "center" as "center", // This casting is usually not necessary
    zIndex: 10,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(5px)" as const, // Use `as const` for newer CSS properties if TypeScript complains
    opacity: 1, // Directly use the state value without additional casting
    transition: "opacity 1s ease-in-out",
  };



  const modalContentStyle = {
    textAlign: "center",
    zIndex: 20,
    position: "relative",
    color: "#FFFFFF",
    fontFamily: "'Nunito', sans-serif",
    padding: "20px",
    maxWidth: "500px",
    margin: "0 auto",
  };

  const buttonStyle = {
    background: "linear-gradient(to right, #FF6B6B, #FFA36B)",
    border: "none",
    borderRadius: "4px",
    color: "#FFFFFF",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Nunito', sans-serif",
    display: "block",
    width: "fit-content",
    margin: "20px auto", // Center button
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2>Thanks for playing along</h2>
        <p>
          <p>
            To be relevant in a living system is to generate vitality. What is that? <br/>It&apos;s relationships that build relationships that build relationships: <br/>3rd &amp; 4th order relational process is real systemic work.<br/> No KPI can measure it. This is #WarmData.
          </p>

        </p>
        <button style={buttonStyle} onClick={() => window.location.reload()}>
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ModalOverlay;
