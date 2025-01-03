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

interface VenueSelectorModalProps {
  nodes: Node[];
  currentLocation: [number, number] | null;
  onSetActiveVenue: (venue: Node) => void;
  onCreateNewVenue: (venue: Node) => void;
  onClose: () => void;
}

const VenueSelectorModal: React.FC<VenueSelectorModalProps> = ({
  nodes,
  currentLocation,
  onSetActiveVenue,
  onCreateNewVenue,
  onClose,
}) => {
  const [recommendedVenue, setRecommendedVenue] = useState<Node | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentLocation) {
      const [longitude, latitude] = currentLocation;

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
    } else {
      setErrorMessage('Unable to determine your location. Please enable location services.');
    }
  }, [currentLocation, nodes]);

  const handleCreateNewVenue = () => {
    if (currentLocation) {
      const [lon, lat] = currentLocation;
      const newVenue: Node = {
        id: `Venue-${Date.now()}`,
        lat,
        lon,
        label: `New Venue ${nodes.length + 1}`,
        vibe: 'User-created vibe',
        visualType: 'Today',
      };

      onCreateNewVenue(newVenue);
    } else {
      setErrorMessage('Cannot determine your location to create a venue.');
    }
  };

  return (
    <div className="venue-selector-modal">
      <div className="modal-content">
        <h2 className="modal-title">Select Your Venue</h2>
        {errorMessage ? (
          <p className="modal-error">{errorMessage}</p>
        ) : recommendedVenue ? (
          <>
            <p className="venue-name">Recommended Venue: {recommendedVenue.label}</p>
            <button
              className="button-primary"
              onClick={() => {
                onSetActiveVenue(recommendedVenue);
                onClose();
              }}
            >
              Set as Active Venue
            </button>
          </>
        ) : (
          <p>No nearby venues found.</p>
        )}
        <button className="button-secondary" onClick={() => onClose()}>
          Select from Map
        </button>
        <button className="button-secondary" onClick={handleCreateNewVenue}>
          Create New Venue
        </button>
      </div>
    </div>
  );
};

export default VenueSelectorModal;
