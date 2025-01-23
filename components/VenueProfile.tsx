'use client';

import React, { useState, useEffect, useRef } from 'react';
import './VenueProfile.css'; // Ensure you have appropriate CSS
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';

type VisualView = 'Today' | 'ThisWeek' | 'AllTime';

interface Venue {
  id: string;
  label: string;
  details: string;  // Use 'details' instead of 'vibe'
  visualType: VisualView;
  createdAt: string;
  updatedAt: string;
  // Add any other fields you need
}

interface VenueProfileProps {
  venue: Venue;
  onClose: () => void;
}

const VenueProfile: React.FC<VenueProfileProps> = ({ venue, onClose }) => {
  const [venueData, setVenueData] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [visualView, setVisualView] = useState<VisualView>('Today');
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const response = await fetch(`/api/venues/${venue.id}`);
        if (response.ok) {
          const data = await response.json();
          setVenueData(data);
        } else {
          console.error('Failed to fetch venue data');
        }
      } catch (error) {
        console.error('Error fetching venue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();
  }, [venue.id]);

  // Effect to handle visual representation (canvas chart)
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.fillText('Mocked "Vibe Over Time" Chart', 10, 20);  // A placeholder for actual chart
      }
    }
  }, []);

  // Render the appropriate visualization based on the selected view
  const renderSphereForView = () => {
    switch (visualView) {
      case 'ThisWeek':
        return <TorusSphereWeek />;
      case 'AllTime':
        return <TorusSphereAll />;
      default:
        return <TorusSphere />;
    }
  };

  return (
    <div
      className="venue-profile-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();  // Close the modal when clicking outside
        }
      }}
    >
      <div className="venue-profile-modal">
        {/* Close button */}
        <button className="close-button" onClick={onClose}>
          &times;
        </button>

        {/* Venue Title and Details */}
        <h2 className="venue-title">{venueData?.label || venue.label}</h2>
        <p className="venue-description">{venueData?.details || venue.details}</p> {/* Using 'details' directly */}

        {/* Visual Representation */}
        <section className="visual-section">
          <div className="visual-toggles">
            {(['Today', 'ThisWeek', 'AllTime'] as VisualView[]).map((view) => (
              <button
                key={view}
                onClick={() => setVisualView(view)}
                className={visualView === view ? 'active' : ''}
              >
                {view}
              </button>
            ))}
          </div>
          <div className="visualization-section">{renderSphereForView()}</div>
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
