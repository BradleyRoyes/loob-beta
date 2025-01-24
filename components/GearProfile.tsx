'use client';

import React, { useState, useEffect } from "react";
import TorusSphere from "./TorusSphere";

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
    loobricateId: string; // ID of the associated loobricate
  };
  onClose: () => void;
  onAddToMap?: () => void;
}

const GearProfile: React.FC<GearProfileProps> = ({ gear, onClose }) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50 px-4 sm:px-6 md:px-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
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

        {/* Visuals */}
        <div className="mb-4">
          <div className="relative h-48 flex justify-center items-center">
            <TorusSphere loobricateId={gear.loobricateId} />
          </div>
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
