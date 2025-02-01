'use client';

import React, { useEffect, useState } from 'react';
import TorusSphere from './TorusSphere';
import './Profile.css';
import LoobricateProfile from './LoobricateProfile';
import LoobricateAdminPanel from './LoobricateAdminPanel';
import { useGlobalState, type Loobricate } from './GlobalStateContext';
import DailyDump from './DailyDump';
import type { LoobricateData } from '../types/loobricate';

const Profile: React.FC = () => {
  const { 
    userId, 
    pseudonym,
    email,
    phone, 
    isAnonymous, 
    clearUserState,
    connectedLoobricates,
    setConnectedLoobricates,
    setUserState
  } = useGlobalState();

  const [entries, setEntries] = useState<any[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);
  const [routeMessage, setRouteMessage] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loobricateUsername, setLoobricateUsername] = useState('');
  const [loobricatePassword, setLoobricatePassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDailyDump, setShowDailyDump] = useState(false);
  const [showLoobricateProfile, setShowLoobricateProfile] = useState(false);
  const [currentLoobricateId, setCurrentLoobricateId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (hasLoadedInitialData || isAnonymous || !userId || userId.startsWith('anon-')) {
        setRouteMessage('You are browsing anonymously. Sign in to access more features.');
        setLoadingState('success');
        return;
      }

      try {
        setLoadingState('loading');
        console.log('Fetching data for user:', userId);
        const response = await fetch(`/api/users/${userId}/data`);
        const data = await response.json();
        
        if (response.ok) {
          console.log('Profile - Received user data:', data);
          
          const shouldUpdateGlobal = 
            data.pseudonym !== pseudonym ||
            data.email !== email ||
            data.phone !== phone ||
            JSON.stringify(data.connectedLoobricates) !== JSON.stringify(connectedLoobricates);

          if (shouldUpdateGlobal) {
            setUserState({
              userId: data._id,
              pseudonym: data.pseudonym,
              email: data.email,
              phone: data.phone,
              isAnonymous: false,
              connectedLoobricates: data.connectedLoobricates || []
            });
          }
          
          // Set local state
          setEntries(data.entries || []);
          setRecentDiscoveries(data.discoveries || []);
          setLoadingState('success');
          setHasLoadedInitialData(true);
        } else {
          console.error('Failed to fetch user data:', data.error);
          setErrorMessage(data.error || 'Failed to fetch user data');
          setLoadingState('error');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        setLoadingState('error');
      }
    };

    fetchUserData();
  }, [userId, isAnonymous, hasLoadedInitialData, pseudonym, email, phone, connectedLoobricates, setUserState]);

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
    console.log('Login form submitted');
    setIsLoggingIn(true);
    setLoginError('');

    try {
      console.log('Sending login request with username:', loobricateUsername);
      const response = await fetch('/api/auth/loobricate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loobricateUsername,
          password: loobricatePassword
        })
      });

      const data = await response.json();
      console.log('Login response status:', response.status);
      console.log('Login response data:', data);

      if (response.ok && data.loobricate) {
        console.log('Login successful, loobricate data:', data.loobricate);
        
        const newLoobricate: Loobricate = {
          id: data.loobricate._id,
          name: data.loobricate.name,
          description: data.loobricate.description || '',
          address: `${data.loobricate.addressLine1}, ${data.loobricate.city}`,
          adminUsername: data.loobricate.adminUsername,
          tags: data.loobricate.tags || [],
          type: data.loobricate.type || 'community',
          members: data.loobricate.members || [],
          admins: data.loobricate.admins || []
        };
        
        // Check if loobricate already exists before adding
        const exists = connectedLoobricates.some(l => l.id === newLoobricate.id);
        if (!exists) {
          setConnectedLoobricates([...connectedLoobricates, newLoobricate]);
        }
        
        setCurrentLoobricateId(newLoobricate.id);
        setShowLoobricateProfile(true);
        setShowLoginForm(false);
        
        // Clear form
        setLoobricateUsername('');
        setLoobricatePassword('');
        setLoginError('');
      } else {
        console.error('Login failed:', data);
        const errorMessage = data.details || data.error || 'Login failed';
        setLoginError(errorMessage);
        
        const inputs = document.querySelectorAll('.form-input') as NodeListOf<HTMLElement>;
        inputs.forEach(input => input.classList.add('error'));
        
        setTimeout(() => {
          inputs.forEach(input => input.classList.remove('error'));
        }, 2000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Add CSS class for visibility
  const loginModalClass = showLoginForm ? 'modal-overlay visible' : 'modal-overlay';

  // Add this function to ensure unique keys
  const getUniqueKey = (loobricate: Loobricate, index: number) => {
    return `${loobricate.id}-${index}` || `loobricate-${index}`;
  };

  // Render loading state
  if (loadingState === 'loading') {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Render error state
  if (loadingState === 'error') {
    return (
      <div className="profile-error">
        <h2>Something went wrong</h2>
        <p>{errorMessage}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {showLoobricateProfile && currentLoobricateId ? (
        <LoobricateAdminPanel
          loobricateId={currentLoobricateId}
          onClose={() => {
            setShowLoobricateProfile(false);
            setCurrentLoobricateId(null);
          }}
          onUpdate={(updatedLoobricate) => {
            const updatedLoobricates = connectedLoobricates.map(l => 
              l.id === updatedLoobricate._id ? {
                ...l,
                name: updatedLoobricate.name,
                description: updatedLoobricate.description,
                address: `${updatedLoobricate.addressLine1}, ${updatedLoobricate.city}`,
                adminUsername: updatedLoobricate.adminUsername,
                tags: updatedLoobricate.tags,
                type: updatedLoobricate.type,
                members: updatedLoobricate.members,
                admins: updatedLoobricate.admins
              } : l
            );
            setConnectedLoobricates(updatedLoobricates);
          }}
        />
      ) : (
        <div className="profile-box">
          <div className="profile-header">
            <p className="pseudonym-label">Pseudonym:</p>
            <p className="pseudonym-value">
              {isAnonymous ? 'Anonymous User' : pseudonym}
            </p>
            {routeMessage && <p className="route-message">{routeMessage}</p>}
          </div>

          <div className="visualization-container">
            <TorusSphere loobricateId={userId || 'default'} />
          </div>

          <div className="daily-section">
            <button 
              className="daily-dump-button"
              onClick={() => setShowDailyDump(true)}
            >
              Daily Dump
            </button>
            <p className="helper-text">
              Share thoughts and goals to help Loob understand you better.
            </p>

            <button 
              className="daily-quest-button"
              onClick={handlePlaceholderClick}
            >
              Daily Quest
            </button>
            <p className="helper-text">
              Get personalized daily quests based on your interests.
            </p>
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

          {/* Main buttons container at the bottom */}
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
      )}

      {/* Login Modal */}
      {showLoginForm && (
        <div className={loginModalClass}>
          <div className="login-form">
            <div className="form-header">
              <h2>Loobricate Login</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setShowLoginForm(false);
                  setLoginError('');
                  setLoobricateUsername('');
                  setLoobricatePassword('');
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLoobricateLogin}>
              <input
                type="text"
                placeholder="Admin Username"
                value={loobricateUsername}
                onChange={(e) => setLoobricateUsername(e.target.value)}
                className="form-input"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loobricatePassword}
                onChange={(e) => setLoobricatePassword(e.target.value)}
                className="form-input"
                required
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

      {showDailyDump && (
        <DailyDump onClose={() => setShowDailyDump(false)} />
      )}
    </div>
  );
};

export default Profile;
