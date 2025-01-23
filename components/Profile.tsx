'use client';

import React, { useEffect, useState } from 'react';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';
import './Profile.css';
import LoobricateProfile from './LoobricateProfile';
import { useGlobalState } from './GlobalStateContext';

const Profile: React.FC = () => {
  const { userId, pseudonym, isAnonymous, clearUserState } = useGlobalState();
  const [sliderValue, setSliderValue] = useState(0); // 0: Today, 1: This Week, 2: All Time
  const [fadeVisual, setFadeVisual] = useState<JSX.Element>(<TorusSphere />);
  const [nextVisual, setNextVisual] = useState<JSX.Element | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loobricates, setLoobricates] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);
  const [routeMessage, setRouteMessage] = useState('');
  const [selectedLoobricate, setSelectedLoobricate] = useState<any>(null);
  const [loobricateUsername, setLoobricateUsername] = useState('');
  const [loobricatePassword, setLoobricatePassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAnonymous || !userId || userId.startsWith('anon-')) {
        setRouteMessage('You are browsing anonymously. Sign in to access more features.');
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}/data`);
        const data = await response.json();
        
        if (response.ok) {
          setEntries(data.entries || []);
          setRecentDiscoveries(data.discoveries || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, isAnonymous]);

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
    clearUserState();
    window.location.reload();
  };

  // Placeholder for button clicks
  const handlePlaceholderClick = () => {
    alert('Feature coming soon!');
  };

  const handleLoobricateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      if (!loobricateUsername || !loobricatePassword) {
        setLoginError('Please enter both username and password');
        return;
      }

      console.log('Attempting login for:', loobricateUsername);

      const response = await fetch('/api/auth/loobricate-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loobricateUsername,
          password: loobricatePassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful for:', data.loobricate.name);
        setShowLoginForm(false);
        setSelectedLoobricate(data.loobricate);
        setLoobricateUsername('');
        setLoobricatePassword('');
      } else {
        console.error('Login failed:', data.error, data.details);
        alert(data.details || data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <div className="profile-header">
          <p className="pseudonym-label">Pseudonym:</p>
          <p className="pseudonym-value">
            {isAnonymous ? 'Anonymous User' : pseudonym}
          </p>
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

        {/* Only show these sections if not anonymous */}
        {isAnonymous ? (
          <>
            {/* Anonymous User Message */}
            <div className="profile-section">
              <h2 className="section-heading">Discoveries & Entries</h2>
              <div className="anonymous-message">
                <p>You are browsing anonymously. Sign in to:</p>
                <ul>
                  <li>Track your discoveries</li>
                  <li>Create Loobrary entries</li>
                  <li>Connect with Loobricates</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
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
                      <div className="button-group">
                        <button className="inline-button" onClick={handlePlaceholderClick}>
                          View on Map
                        </button>
                        <button className="inline-button" onClick={handlePlaceholderClick}>
                          Share
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">You have no recent discoveries yet.</p>
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
                      <div className="button-group">
                        <button className="inline-button" onClick={handlePlaceholderClick}>
                          Edit
                        </button>
                        <button className="inline-button" onClick={handlePlaceholderClick}>
                          View Details
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">You have not added any entries to the Loobrary yet.</p>
              )}
            </div>
          </>
        )}

        {/* Move buttons to bottom */}
        <div className="buttons-container">
          <div className="button-group">
            <button className="logout-button" onClick={handleLogOut}>
              Log Out
            </button>
            <button 
              className="loobricate-login-button"
              onClick={() => setShowLoginForm(true)}
            >
              Loobricate Login
            </button>
          </div>
        </div>
      </div>

      {/* Login Form Modal */}
      {showLoginForm && (
        <div className="modal-overlay">
          <div className="login-form">
            <div className="form-header">
              <h2>Loobricate Login</h2>
              <button className="close-button" onClick={() => setShowLoginForm(false)}>×</button>
            </div>
            <form onSubmit={handleLoobricateLogin}>
              <input
                type="text"
                placeholder="Username"
                value={loobricateUsername}
                onChange={(e) => {
                  setLoobricateUsername(e.target.value);
                  setLoginError('');
                }}
                className={`form-input ${loginError ? 'error' : ''}`}
                disabled={isLoggingIn}
              />
              <input
                type="password"
                placeholder="Password"
                value={loobricatePassword}
                onChange={(e) => {
                  setLoobricatePassword(e.target.value);
                  setLoginError('');
                }}
                className={`form-input ${loginError ? 'error' : ''}`}
                disabled={isLoggingIn}
              />
              {loginError && <p className="error-message">{loginError}</p>}
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Loobricate Profile Modal */}
      {selectedLoobricate && (
        <div className="modal-overlay">
          <LoobricateProfile
            loobricate={selectedLoobricate}
            onClose={() => setSelectedLoobricate(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Profile;
