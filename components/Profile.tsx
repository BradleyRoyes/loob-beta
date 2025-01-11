'use client';

import React, { useState } from 'react';
import { useGlobalState } from './GlobalStateContext'; // Adjust the path as necessary
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';
import VenueProfile from './VenueProfile';
import Footer from './Footer'; // Import Footer component
import './Profile.css'; // Import the corresponding CSS

type VisualView = 'Today' | 'ThisWeek' | 'AllTime';

interface Venue {
  id: string;
  label: string;
  details: string;  // Using 'details' instead of 'vibe'
  visualType: VisualView;
}

const Profile: React.FC = () => {
  const { userId } = useGlobalState(); // Fetch pseudonym from global state

  const [visualView, setVisualView] = useState<VisualView>('Today');

  // Updated venue data to use 'details' instead of 'vibe'
  const [myVenues] = useState<Venue[]>([
    { id: 'venue1', label: 'My Loft Party', details: 'Energetic and intimate', visualType: 'Today' },
    { id: 'venue2', label: 'Rooftop Techno', details: 'Open-air vibes with deep beats', visualType: 'ThisWeek' },
  ]);

  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [showVenueProfile, setShowVenueProfile] = useState(false);

  const openVenueProfile = (venue: Venue) => {
    setActiveVenue(venue);  // No need to map 'details' to 'vibe' anymore
    setShowVenueProfile(true);
  };

  const closeVenueProfile = () => {
    setActiveVenue(null);
    setShowVenueProfile(false);
  };

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
    <div className="profile-container">
      <main className="profile-main">
        <div className="profile-content-wrapper">
          <section className="pseudonym-section">
            <p className="pseudonym-label">Pseudonym:</p>
            <p className="pseudonym-value">{userId ?? 'No pseudonym set'}</p>
          </section>

          <section className="visual-toggles">
            {(['Today', 'ThisWeek', 'AllTime'] as VisualView[]).map((view) => (
              <button key={view} onClick={() => setVisualView(view)}>
                {view}
              </button>
            ))}
          </section>

          <section className="visualization-section">{renderSphereForView()}</section>

          <section className="your-venues-section">
            <h2 className="venues-heading">Your Venues</h2>
            <ul className="venues-list">
              {myVenues.map((venue) => (
                <li key={venue.id} className="venue-item">
                  <span className="venue-label">{venue.label}</span>
                  <button onClick={() => openVenueProfile(venue)}>Open</button>
                </li>
              ))}
              {myVenues.length === 0 && <p className="no-venues">You have no venues yet.</p>}
            </ul>
          </section>
        </div>
      </main>

      {showVenueProfile && activeVenue && (
        <VenueProfile venue={activeVenue} onClose={closeVenueProfile} />
      )}

      <Footer />
    </div>
  );
};

export default Profile;
