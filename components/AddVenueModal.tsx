'use client';
import React, { useState } from 'react';

/**
 * Mini modal for user to type in a new venue name.
 * We pass the currentLocation from the parent or do some confirmation. 
 */

interface AddVenueModalProps {
  onClose: () => void;
  onConfirm: (venueName: string) => void;
  // Optionally: pass in the user's location or other info if needed
}

const AddVenueModal: React.FC<AddVenueModalProps> = ({ onClose, onConfirm }) => {
  const [venueName, setVenueName] = useState('');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-800 text-white p-4 rounded-md shadow-lg relative w-80">
        <button
          className="absolute top-2 right-2 text-xl text-gray-300 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4">Add New Venue</h2>
        <p className="text-sm mb-3">
          Please enter a name for the new venue at your current location.
        </p>
        <input
          type="text"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="My Awesome Venue"
          className="w-full px-3 py-2 rounded-md bg-gray-700 text-white mb-3"
        />
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (venueName.trim()) {
                onConfirm(venueName.trim());
              } else {
                alert('Please enter a venue name.');
              }
            }}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-orange-300 to-pink-300 text-black font-semibold hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVenueModal;
