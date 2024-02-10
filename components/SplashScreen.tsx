// SplashScreen.tsx
import React, { useState } from "react";

interface SplashScreenProps {
  onEnter: () => void; // No need to pass sessionId since it's handled in the parent component
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [name, setName] = useState("");

  // Function to handle entering the app and trigger the fade-out animation
  const enterApp = () => {
    onEnter(); // Trigger the parent component's action
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black z-50 fade-in">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">
          Welcome to Loob
        </h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your name..."
            className="text-white mb-2 p-2 border-b border-white bg-transparent" // Add border and remove background color
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-white text-sm"> Do you have a name? (optional)</p>
        </div>
        <button
          onClick={enterApp} // Trigger the fade-out animation and enter the app
          className="px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition duration-150"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default SplashScreen;
