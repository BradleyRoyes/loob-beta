'use client';

import React, { useEffect, useState } from 'react';

type VisualType = 'Today' | 'ThisWeek' | 'AllTime';

interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  vibe: string;
  visualType: VisualType;
}

interface VenueSelectorProps {
  nodes: Node[]; // Existing venues
  setActiveVenue: (venue: Node) => void; // Callback to set the active venue
  onClose: () => void; // Callback to close the modal
}

const VenueSelector: React.FC<VenueSelectorProps> = ({ nodes, setActiveVenue, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [recommendedVenue, setRecommendedVenue] = useState<Node | null>(null);
  const [newVenueName, setNewVenueName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location: [number, number] = [longitude, latitude];
          setCurrentLocation(location);

          // Find the closest venue
          const closestVenue = nodes.reduce((closest: Node | null, node) => {
            const distance = Math.sqrt(
              Math.pow(node.lat - latitude, 2) + Math.pow(node.lon - longitude, 2)
            );
            if (!closest || distance < Math.sqrt(Math.pow(closest.lat - latitude, 2) + Math.pow(closest.lon - longitude, 2))) {
              return node;
            }
            return closest;
          }, null);

          setRecommendedVenue(closestVenue);
          setIsLoading(false);
        },
        (error) => {
          setErrorMessage('Unable to retrieve your location. Please enable location services.');
          console.error('Geolocation error:', error);
          setIsLoading(false);
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  }, [nodes]);

  const handleSelectRecommended = () => {
    if (recommendedVenue) {
      setActiveVenue(recommendedVenue);
      onClose(); // Close the modal
    }
  };

  const handleCreateNewVenue = () => {
    if (!newVenueName.trim()) {
      setErrorMessage('Venue name cannot be empty.');
      return;
    }

    if (currentLocation) {
      const [lon, lat] = currentLocation;
      const newVenue: Node = {
        id: `Venue-${Date.now()}`,
        lat,
        lon,
        label: newVenueName,
        vibe: 'User-created vibe',
        visualType: 'Today',
      };

      setActiveVenue(newVenue); // Set the new venue as the active venue
      onClose(); // Close the modal
    } else {
      setErrorMessage('Unable to determine your location for the new venue.');
    }
  };

  return (
    <div className="venue-selector-modal">
      <div className="modal-content">
        <h2 className="modal-title">Select Your Venue</h2>

        {errorMessage && <p className="modal-error">{errorMessage}</p>}

        {isLoading ? (
          <p>Loading your location...</p>
        ) : currentLocation ? (
          <div className="modal-section">
            <h3 className="modal-subtitle">Recommended Venue</h3>
            {recommendedVenue ? (
              <div className="recommended-venue">
                <p className="venue-name">{recommendedVenue.label}</p>
                <p className="venue-description">{recommendedVenue.vibe}</p>
                <button className="button-primary" onClick={handleSelectRecommended}>
                  Select {recommendedVenue.label}
                </button>
              </div>
            ) : (
              <p>No nearby venues found. You can create a new venue below.</p>
            )}

            <div className="modal-divider"></div>

            <h3 className="modal-subtitle">Or Create a New Venue</h3>
            <input
              type="text"
              className="input-new-venue"
              placeholder="Enter new venue name"
              value={newVenueName}
              onChange={(e) => {
                setErrorMessage(''); // Clear error on input
                setNewVenueName(e.target.value);
              }}
            />
            <button className="button-secondary" onClick={handleCreateNewVenue}>
              Create New Venue
            </button>
          </div>
        ) : (
          <p>Unable to detect your location.</p>
        )}

        <button className="button-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default VenueSelector;
