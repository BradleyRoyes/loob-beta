'use client';

import React, { useState, useEffect } from "react";
import "./GearProfile.css";
import TorusSphere from "./TorusSphere";
import TorusSphereWeek from "./TorusSphereWeek";
import TorusSphereAll from "./TorusSphereAll";

interface HistoryEntry {
  action: string;
  date: string;
  location: string;
}

interface GearProfileProps {
  gear: {
    id: string;
    name: string;
    description: string;
    status: string;
    history: HistoryEntry[];
  };
  onClose: () => void;
}

const GearProfile: React.FC<GearProfileProps> = ({ gear, onClose }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [fadeVisual, setFadeVisual] = useState<JSX.Element>(<TorusSphere />);
  const [nextVisual, setNextVisual] = useState<JSX.Element | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);

    if (newValue === 0) setNextVisual(<TorusSphere />);
    else if (newValue === 1) setNextVisual(<TorusSphereWeek />);
    else if (newValue === 2) setNextVisual(<TorusSphereAll />);
    
    setSliderValue(newValue);
  };

  useEffect(() => {
    if (nextVisual) {
      // Begin the fade transition
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setFadeVisual(nextVisual); // Update the main visual
        setIsTransitioning(false); // End the transition
        setNextVisual(null); // Clear next visual
      }, 8000); // Match fade duration

      return () => clearTimeout(timer);
    }
  }, [nextVisual]);

  const getViewLabel = () => {
    if (sliderValue === 0) return "Today";
    if (sliderValue === 1) return "This Week";
    return "All Time";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-800 text-white rounded-lg w-full max-w-lg md:max-w-2xl p-6 relative overflow-y-auto max-h-[80vh] md:max-h-[90vh]">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-xl text-gray-400 hover:text-white"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Gear Information */}
        <h2 className="text-2xl font-bold mb-2 text-center">{gear.name}</h2>
        <p className="text-gray-400 mb-4 text-center">{gear.description}</p>

        {/* Visuals and Slider */}
        <div className="mb-4">
          <div className="relative h-48 flex justify-center items-center">
            {/* Current Visual */}
            <div
              className={`absolute transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {fadeVisual}
            </div>
            {/* Next Visual */}
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
            className="w-full appearance-none h-2 bg-gray-700 rounded-lg"
            style={{
              backgroundImage: "linear-gradient(to right, #fed7aa, #fcd1d1)", // Pastel orange gradient
            }}
          />
        </div>

        {/* Status */}
        <div className="mb-4">
          <strong>Status:</strong> {gear.status}
        </div>

        {/* Check In / Check Out Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => alert("Item Checked In")}
            className="px-4 py-2 bg-pink-300 text-black rounded-md hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Check In
          </button>
          <button
            onClick={() => alert("Item Checked Out")}
            className="px-4 py-2 bg-orange-300 text-black rounded-md hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            Check Out
          </button>
        </div>

        {/* History Section */}
        <div>
          <h3 className="text-lg font-bold mb-2">History</h3>
          <ul className="space-y-2">
            {gear.history.map((entry, index) => (
              <li key={index} className="bg-gray-700 p-2 rounded">
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
