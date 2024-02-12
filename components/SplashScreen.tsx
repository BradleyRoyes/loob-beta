import React, { useState, useEffect } from "react";

interface SplashScreenProps {
  onEnter: (selectedLocation: string) => void; // Pass the selected location to the parent component
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [location, setLocation] = useState("");
  const [autoDetectedLocation, setAutoDetectedLocation] = useState("");

  useEffect(() => {
    // Attempt to get the user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Use a service like Google Maps Geocoding API to convert coordinates to a human-readable location
        // This is a placeholder for such a service
        const currentLocation = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
        setAutoDetectedLocation(currentLocation);
        setLocation(currentLocation); // Automatically set the detected location
      },
      (error) => console.error(error),
      { timeout: 10000 }
    );
  }, []);

  // Function to handle entering the app
  const enterApp = () => {
    onEnter(location); // Pass the selected or detected location to the parent component's action
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black z-50 fade-in">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">
          Welcome to Loob
        </h1>
        <div className="mb-4">
          <select
            className="text-white mb-2 p-2 border-b border-white bg-transparent appearance-none" // Styled dropdown
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value={autoDetectedLocation}>Auto-Detect Location</option>
            <option value="MOOS Space Berlin">Location 1</option>
            <option value="Kit Kat Club Berlin">Location 2</option>
            <option value="At Home">Location 3</option>
            {/* Add more locations as needed */}
          </select>
          <p className="text-white text-sm">Select your location (optional)</p>
        </div>
        <button
          onClick={enterApp}
          className="px-6 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition duration-150"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
