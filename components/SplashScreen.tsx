// SplashScreen.tsx
import React, { useState } from "react";
import "../app/SplashScreen.module.css"; // Ensure this path matches where you've placed the CSS file

interface SplashScreenProps {
  onEnter: (sessionId: string) => void; // Updated to accept a session ID string
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [name, setName] = useState("");

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black z-50 fade-in">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">
          Welcome to Loob Labs
        </h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your name..."
            className="text-white mb-2 p-2 border-b border-white" // Add border and remove background color
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-white text-sm">What shall we call you? (optional)</p>
        </div>
        <button
          onClick={() => onEnter(name || "defaultSessionId")} // Use the provided name or a default
          className="px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition duration-150"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default SplashScreen;