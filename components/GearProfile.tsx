'use client';

import React, { useState, useEffect } from "react";
import TorusSphere from "./TorusSphere";
import TorusSphereWeek from "./TorusSphereWeek";
import TorusSphereAll from "./TorusSphereAll";

// Define the structure of history entries
interface HistoryEntry {
  action: string;
  date: string;
  location: string;
}

// Define the props for the GearProfile component
interface GearProfileProps {
  gear: {
    id: string;
    name: string;
    description: string;
    status: string;
    history: HistoryEntry[];
  };
  onClose: () => void;
  onAddToMap?: () => void; // Optional prop if needed in the future
}

const GearProfile: React.FC<GearProfileProps> = ({ gear, onClose }) => {
  // State for slider value and transitioning visuals
  const [sliderValue, setSliderValue] = useState(0);
  const [fadeVisual, setFadeVisual] = useState<JSX.Element>(<TorusSphere />);
  const [nextVisual, setNextVisual] = useState<JSX.Element | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle slider changes to update visuals
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);

    // Set the next visual based on slider value
    if (newValue === 0) setNextVisual(<TorusSphere />);
    else if (newValue === 1) setNextVisual(<TorusSphereWeek />);
    else if (newValue === 2) setNextVisual(<TorusSphereAll />);

    setSliderValue(newValue);
  };

  // Handle transitions between visuals
  useEffect(() => {
    if (nextVisual) {
      setIsTransitioning(true); // Start the transition

      const timer = setTimeout(() => {
        setFadeVisual(nextVisual); // Set the new visual
        setIsTransitioning(false); // End the transition
        setNextVisual(null); // Clear the next visual
      }, 800); // Transition duration

      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [nextVisual]);

  // Determine the label for the current view
  const getViewLabel = () => {
    if (sliderValue === 0) return "Today";
    if (sliderValue === 1) return "This Week";
    return "All Time";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 px-4 sm:px-6 md:px-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose(); // Close modal when clicking outside
        }
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-lg p-6 relative overflow-y-auto max-h-[80vh]">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-xl text-gray-400 hover:text-white"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Gear name and description */}
        <h2 className="text-2xl font-bold mb-2 text-center">{gear.name}</h2>
        <p className="text-gray-400 mb-4 text-center">{gear.description}</p>

        {/* Visuals with slider control */}
        <div className="mb-4">
          <div className="relative h-48 flex justify-center items-center">
            {/* Current visual */}
            <div
              className={`absolute transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {fadeVisual}
            </div>

            {/* Next visual during transition */}
            {nextVisual && (
              <div
                className={`absolute transition-opacity duration-300 ${
                  isTransitioning ? "opacity-100" : "opacity-0"
                }`}
              >
                {nextVisual}
              </div>
            )}
          </div>
          
          {/* Slider for changing views */}
          <label htmlFor="viewSlider" className="text-gray-300 block text-center mb-2">
            View: {getViewLabel()}
          </label>
          <input
            type="range"
            id="viewSlider"
            min="0"
            max="2"
            step="1"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full appearance-none h-2 rounded-lg"
            style={{
              background: "linear-gradient(to right, #fbc2eb, #a6c1ee)", // Pastel gradient
            }}
          />

          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              width: 16px; /* Width of the knob */
              height: 16px; /* Height of the knob */
              background: #f5f5dc; /* Cream color for the knob */
              border-radius: 50%; /* Rounded knob */
              transition: all 0.2s ease; /* Smooth sliding effect */
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
            }
            
            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.1); /* Slightly larger knob on hover */
            }

            input[type="range"]:hover {
              background: linear-gradient(to right, #fcd4e2, #d0e3fc); /* Slightly lighter gradient on hover */
            }
          `}</style>
        </div>

        {/* Gear status */}
        <div className="mb-4">
          <strong>Status:</strong> {gear.status}
        </div>

        {/* Placeholder button for Add to Map functionality */}
        <div className="flex flex-col mb-6">
          <button
            onClick={() => alert("Feature coming soon!")}
            className="gradient-button"
          >
            Add to Map
          </button>
        </div>

        {/* Gear history */}
        <div>
          <h3 className="text-lg font-bold mb-2">History</h3>
          <ul className="space-y-2">
            {gear.history.map((entry, index) => (
              <li key={index} className="bg-gray-800 p-2 rounded">
                <strong>{entry.action}</strong> - {entry.date} at {entry.location}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GearProfile;
