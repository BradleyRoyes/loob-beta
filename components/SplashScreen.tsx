import React, { useState, useEffect } from "react";
import "../app/SplashScreen.module.css"; // Ensure this path matches where you've placed the CSS file

interface SplashScreenProps {
  onEnter: (sessionId: string) => void; // Updated to accept a session ID string
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [name, setName] = useState("");
  const [fadeout, setFadeout] = useState(false); // State to control fade-out animation

  // Function to trigger fade-out animation and close the splash screen
  const closeSplashScreen = () => {
    setFadeout(true);
    // Optionally, add a delay before executing any action after fade-out
    setTimeout(() => {
      // Add any necessary actions after fade-out (e.g., navigating to a different screen)
    }, 1000); // Adjust the delay as needed to match the duration of your fade-out animation
  };

  useEffect(() => {
    // Simulate closing the splash screen after a certain delay (e.g., 3 seconds)
    const timer = setTimeout(closeSplashScreen, 3000); // Adjust the delay as needed
    return () => clearTimeout(timer);
  }, []); // Run only once on component mount

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black z-50 ${fadeout ? 'fade-out' : 'fade-in'}`}>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">
          Welcome to Loob Labs
        </h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your name..."
            className="text-white mb-2 p-2 border-b border-white bg-transparent" // Add border and remove background color
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-white text-sm">What can we call you? (optional)</p>
        </div>
        <button
          onClick={() => {
            closeSplashScreen();
            onEnter(name || "defaultSessionId"); // Use the provided name or a default
          }}
          className="px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition duration-150"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default SplashScreen;
