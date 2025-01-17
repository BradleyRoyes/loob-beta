'use client';

import React, { useEffect, useState } from 'react';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';
import './Profile.css';

const Profile: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(0); // 0: Today, 1: This Week, 2: All Time
  const [fadeVisual, setFadeVisual] = useState<JSX.Element>(<TorusSphere />);
  const [nextVisual, setNextVisual] = useState<JSX.Element | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userId, setUserId] = useState<string | null>('anon-za7ta6nfv'); // Mock user ID
  const [loobricates, setLoobricates] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);
  const [routeMessage, setRouteMessage] = useState('');

  // Mock fetching profile data
  useEffect(() => {
    if (!userId) {
      setRouteMessage('No pseudonym set. Please log in or stay anonymous.');
      return;
    }
    setLoobricates([
      { id: '1', name: 'Loobricate 1', description: 'Description of Loobricate 1' },
    ]);
    setEntries([{ id: '1', label: 'Entry 1', details: 'Details of Entry 1' }]);
    setRecentDiscoveries([{ id: '1', title: 'Discovery 1', dateVisited: '2025-01-15' }]);
    setRouteMessage('Welcome back, anon-za7ta6nfv!');
  }, [userId]);

  // Handle slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setSliderValue(newValue);

    if (newValue === 0) setNextVisual(<TorusSphere />);
    if (newValue === 1) setNextVisual(<TorusSphereWeek />);
    if (newValue === 2) setNextVisual(<TorusSphereAll />);
  };

  // Smooth transition animations for the slider
  useEffect(() => {
    if (nextVisual) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setFadeVisual(nextVisual);
        setIsTransitioning(false);
        setNextVisual(null);
      }, 500); // Reduced transition duration for smoother effect
      return () => clearTimeout(timer);
    }
  }, [nextVisual]);

  // Placeholder for Loobricate Sign In
  const handleSignInClick = () => {
    alert('Feature coming soon!');
  };

  // Log out and clear user state
  const handleLogOut = () => {
    setUserId(null);
    setRouteMessage('You have been logged out.');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <p className="pseudonym-label">Pseudonym:</p>
        <p className="pseudonym-value">{userId ?? 'No pseudonym set'}</p>
        {routeMessage && <p className="route-message">{routeMessage}</p>}
      </div>

      {/* Visualization Slider */}
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={sliderValue}
          onChange={handleSliderChange}
          className="visual-slider"
        />
      </div>

      {/* Sphere Visualization */}
      <div className="visualization-section">
        <div className={`fade-visual ${isTransitioning ? 'fade-out' : 'fade-in'}`}>{fadeVisual}</div>
        {nextVisual && (
          <div className={`fade-visual ${isTransitioning ? 'fade-in' : 'fade-out'}`}>{nextVisual}</div>
        )}
      </div>

      {/* Recent Discoveries */}
      <div className="profile-section">
        <h2 className="section-heading">Recent Discoveries</h2>
        {recentDiscoveries.length > 0 ? (
          <ul className="list">
            {recentDiscoveries.map((r) => (
              <li key={r.id} className="list-item">
                <span>{r.title}</span>
                <p>Visited on: {new Date(r.dateVisited).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-message">You have no recent discoveries yet.</p>
        )}
      </div>

      {/* Loobricates and Entries (Two Columns on Desktop) */}
      <div className="two-column-layout">
        <div className="column">
          <h2 className="section-heading">Your Loobricates</h2>
          {loobricates.length > 0 ? (
            <ul className="list">
              {loobricates.map((l) => (
                <li key={l.id} className="list-item">
                  <span>{l.name}</span>
                  <p>{l.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">You are not part of any Loobricates yet.</p>
          )}
        </div>
        <div className="column">
          <h2 className="section-heading">Your Loobrary Entries</h2>
          {entries.length > 0 ? (
            <ul className="list">
              {entries.map((e) => (
                <li key={e.id} className="list-item">
                  <span>{e.label}</span>
                  <p>{e.details}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">You have not added any entries to the Loobrary yet.</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="buttons-container">
        <button className="logout-button" onClick={handleLogOut}>
          Log Out
        </button>
        <button className="signin-button" onClick={handleSignInClick}>
          Loobricate Sign In
        </button>
      </div>
    </div>
  );
};

export default Profile;
