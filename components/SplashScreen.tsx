import React, { useState, useEffect } from "react";

const SplashScreen: React.FC<{ onEnter: (action: string) => void }> = ({ onEnter }) => {
  const [phase, setPhase] = useState("selectLocation");
  const [location, setLocation] = useState("");
  const [autoDetectedLocation, setAutoDetectedLocation] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
        setAutoDetectedLocation(currentLocation);
        setLocation(currentLocation);
      },
      (error) => console.error(error),
      { timeout: 10000 }
    );
  }, []);

  const transitionToQuestions = () => {
    setPhase("animate");
    setTimeout(() => setPhase("askQuestion"), 1000); // Adjust timing as needed
  };

  const handleQuestionSelect = (action: string) => {
    onEnter(action);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
      {phase === "selectLocation" && (
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Welcome to Loob</h1>
          <select
            className="mb-4 p-2 border-b border-white bg-transparent text-white appearance-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Select your location</option>
            <option value="auto">Auto-Detect Location</option>
            <option value="Location 1">Location 1</option>
            <option value="Location 2">Location 2</option>
          </select>
          <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={transitionToQuestions}>
            Confirm Location
          </button>
        </div>
      )}

      {phase === "animate" && <div className="fadeEffect">Loading...</div>}

      {phase === "askQuestion" && (
        <div className="text-center">
          <button className="mb-4 px-6 py-2 border border-white rounded transition duration-150" onClick={() => handleQuestionSelect("share")}>
            I want to share an experience
          </button>
          <button className="mb-4 px-6 py-2 border border-white rounded transition duration-150" onClick={() => handleQuestionSelect("visit")}>
            I want to visit MOOS
          </button>
          <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={() => handleQuestionSelect("host")}>
            I want to host at MOOS
          </button>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
