import React, { useState, useEffect } from "react";

interface SplashScreenProps {
  onEnter: (action: string) => void; // Adjusted to pass the action selected by the user
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [phase, setPhase] = useState("selectLocation");
  const [location, setLocation] = useState("");
  const [autoDetectedLocation, setAutoDetectedLocation] = useState("");

  useEffect(() => {
    // Attempt to get the user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
        setAutoDetectedLocation(currentLocation);
        setLocation(currentLocation); // Automatically set the detected location
      },
      (error) => console.error(error),
      { timeout: 10000 }
    );
  }, []);

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setPhase("animate");
    setTimeout(() => {
      setPhase("askQuestion");
    }, 3000); // Simulate the animation duration
  };

  const handleQuestionSelect = (question: string) => {
    onEnter(question); // Pass the selected action to the parent component
  };

  if (phase === "selectLocation") {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black z-50 fade-in">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Welcome to Loob</h1>
          <div className="mb-4">
            <select
              className="text-white mb-2 p-2 border-b border-white bg-transparent appearance-none"
              value={location}
              onChange={(e) => handleLocationSelect(e.target.value)}
            >
              <option value={autoDetectedLocation}>Auto-Detect Location</option>
              <option value="Location 1">Moos Space</option>
              <option value="Location 2">Location 2</option>
              <option value="Location 3">Location 3</option>
              {/* Add more locations as needed */}
            </select>
            <p className="text-white text-sm">Select your location (optional)</p>
          </div>
          <button
            onClick={() => setPhase("animate")}
            className="px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition duration-150"
          >
            Confirm Location
          </button>
        </div>
      </div>
    );
  } else if (phase === "animate") {
    // Implement your tunneling animation here
    return (
      <div className="animationScreen">
        <p>Animating...</p>
      </div>
    );
  } else if (phase === "askQuestion") {
    return (
      <div className="questionScreen">
        <button onClick={() => handleQuestionSelect("share")}>I want to share an experience</button>
        <button onClick={() => handleQuestionSelect("visit")}>I want to visit MOOS</button>
        <button onClick={() => handleQuestionSelect("host")}>I want to host at MOOS</button>
      </div>
    );
  }

  return null; // Default return, should not reach here
};

export default SplashScreen;
