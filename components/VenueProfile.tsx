'use client';

import React, { useState, useEffect, useRef } from 'react';
import './VenueProfile.css'; // Ensure you have appropriate CSS
import TorusSphere from './TorusSphere';

interface Venue {
  id: string;
  label: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

interface VenueProfileProps {
  venue: Venue;
  onClose: () => void;
}

const VenueProfile: React.FC<VenueProfileProps> = ({ venue, onClose }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div className="venue-profile-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="venue-profile-modal">
        <button className="close-button" onClick={onClose}>&times;</button>

        <h2 className="venue-title">{venue.label}</h2>
        <p className="venue-description">{venue.details}</p>

        {/* Visual Representation */}
        <section className="visual-section">
          <div className="visualization-section">
            <TorusSphere loobricateId={venue.id} />
          </div>
        </section>

        {/* Scrollable content section */}
        <section className="scrollable-content">
          {/* Word Cloud */}
          <div className="word-cloud-section">
            <h3 className="section-heading">Word Cloud</h3>
            <div className="word-cloud">
              <span>Techno</span>
              <span>Berlin</span>
              <span>Industrial</span>
              <span>Dark</span>
              <span>Minimal</span>
              <span>Long Sets</span>
              <span>Legendary</span>
              <span>Beats</span>
              <span>Underground</span>
            </div>
          </div>

          {/* Vibe Over Time Chart */}
          <div className="chart-section">
            <h3 className="section-heading">Vibe Over Time</h3>
            <div className="chart-container">
              <canvas ref={chartRef} width="400" height="150" />
            </div>
          </div>

          {/* Organizer Log In Section */}
          <div className="organizer-login-section">
            <button onClick={() => alert('Redirecting to Organizer Dashboard...')}>
              Organizer Log In
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VenueProfile;
