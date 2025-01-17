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
      { id: '1', name: 'GreenTech Berlin', description: 'Community focused on green technologies.' },
      { id: '2', name: 'Web3 Innovators', description: 'Exploring decentralized systems.' },
    ]);
    setEntries([
      { id: '1', label: 'Gear: VR Headset', details: 'High-performance VR headset for prototyping.' },
      { id: '2', label: 'Talent: UX Designer', details: 'Experienced in immersive environments.' },
      { id: '3', label: 'Location: Event Space', details: 'Futuristic venue in Berlin.' },
    ]);
    setRecentDiscoveries([
      { id: '1', title: 'Disruptive AI Workshop', dateVisited: '2025-01-15' },
      { id: '2', title: 'Berlin Hackathon', dateVisited: '2025-01-10' },
    ]);
    setRouteMessage('Welcome back, anonymous user!');
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
      }, 500); // Smooth transition duration
      return () => clearTimeout(timer);
    }
  }, [nextVisual]);

  // Log Out Button Handler
  const handleLogOut = () => {
    setUserId(null);
    window.location.reload(); // Simulates exiting to sign-in screen
  };

  // Placeholder for button clicks
  const handlePlaceholderClick = () => {
    alert('Feature coming soon!');
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <div className="profile-header">
          <p className="pseudonym-label">Pseudonym:</p>
          <p className="pseudonym-value">{userId ?? 'No pseudonym set'}</p>
          {routeMessage && <p className="route-message">{routeMessage}</p>}
        </div>

        {/* Sphere Visualization and Slider */}
        <div className="visualization-container">
          <div className={`fade-visual ${isTransitioning ? 'fade-out' : 'fade-in'}`}>{fadeVisual}</div>
          {nextVisual && (
            <div className={`fade-visual ${isTransitioning ? 'fade-in' : 'fade-out'}`}>{nextVisual}</div>
          )}
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

        {/* Recent Discoveries */}
        <div className="profile-section">
          <h2 className="section-heading">Your Recent Discoveries</h2>
          {recentDiscoveries.length > 0 ? (
            <ul className="list">
              {recentDiscoveries.map((r) => (
                <li key={r.id} className="list-item">
                  <div className="list-item-content">
                    <span>{r.title}</span>
                    <p>Visited on: {new Date(r.dateVisited).toLocaleDateString()}</p>
                  </div>
                  <button className="inline-button" onClick={handlePlaceholderClick}>
                    View on Map
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">You have no recent discoveries yet.</p>
          )}
        </div>

        {/* Loobricates */}
        <div className="profile-section">
          <h2 className="section-heading">Your Loobricates</h2>
          {loobricates.length > 0 ? (
            <ul className="list">
              {loobricates.map((l) => (
                <li key={l.id} className="list-item">
                  <div className="list-item-content">
                    <span>{l.name}</span>
                    <p>{l.description}</p>
                  </div>
                  <button className="inline-button" onClick={handlePlaceholderClick}>
                    Join
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">You are not part of any Loobricates yet.</p>
          )}
        </div>

        {/* Loobrary Entries */}
        <div className="profile-section">
          <h2 className="section-heading">Your Loobrary Entries</h2>
          {entries.length > 0 ? (
            <ul className="list">
              {entries.map((e) => (
                <li key={e.id} className="list-item">
                  <div className="list-item-content">
                    <span>{e.label}</span>
                    <p>{e.details}</p>
                  </div>
                  <button className="inline-button" onClick={handlePlaceholderClick}>
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">You have not added any entries to the Loobrary yet.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="buttons-container">
          <button className="logout-button" onClick={handleLogOut}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
