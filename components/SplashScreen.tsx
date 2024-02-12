import React, { useState } from "react";

interface SplashScreenProps {
  onEnter: () => void; // Assuming this triggers the transition to the main content
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [phase, setPhase] = useState("selectLocation");

  const handleLocationSelect = (location: string) => {
    // Depending on the location, you could do something specific here
    setPhase("selectAction");
  };

  const handleActionSelect = () => {
    // This function will be called when an action is selected
    onEnter(); // Proceed to the main content or handle the action specifically
  };

  if (phase === "selectLocation") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white space-y-4">
        <h1 className="text-2xl font-bold">Welcome to Loob</h1>
        <p>Where are you?</p>
        <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={() => handleLocationSelect("mooseSpaceBerlin")}>
          Moose Space Berlin
        </button>
        <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={() => handleLocationSelect("atTheClub")}>
          At the Club
        </button>
        <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={() => handleLocationSelect("atHome")}>
          At Home
        </button>
      </div>
    );
  } else if (phase === "selectAction") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white space-y-4">
        <h1 className="text-2xl font-bold">What would you like to do?</h1>
        <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={handleActionSelect}>
          I'd like to share an experience
        </button>
        <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={handleActionSelect}>
          I'd like to host at Moose
        </button>
        <button className="px-6 py-2 border border-white rounded transition duration-150" onClick={handleActionSelect}>
          I'd like to visit Moose
        </button>
      </div>
    );
  }

  return null; // Default return, should not reach here
};

export default SplashScreen;
