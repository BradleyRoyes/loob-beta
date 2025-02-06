'use client';

import React, { useState } from 'react';
import './LoobricateProfile.css';
import VibeEntity from './VibeEntity';
import type { LoobricateData } from '../types/loobricate';
import LoobricateAdminPanel from './LoobricateAdminPanel';
import { FaLock, FaUserCircle } from 'react-icons/fa';
import { useGlobalState } from './GlobalStateContext';

interface Props {
  loobricate: LoobricateData;
  onClose: () => void;
  onUpdate: (updatedLoobricate: LoobricateData) => void;
}

const LoobricateProfile: React.FC<Props> = ({ loobricate, onClose, onUpdate }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentLoobricate, setCurrentLoobricate] = useState(loobricate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showVibeComparison, setShowVibeComparison] = useState(false);
  const { userId } = useGlobalState();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/loobricate-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowLoginForm(false);
        setShowAdminPanel(true);
        setUsername('');
        setPassword('');
        // Update current loobricate with latest data
        setCurrentLoobricate(data.loobricate);
      } else {
        setLoginError(data.details || data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdate = async (updatedLoobricate: LoobricateData) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/loobricates/${updatedLoobricate._id}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify loobricate update');
      }
      
      const verifiedData = await response.json();
      setCurrentLoobricate(verifiedData);
      onUpdate(verifiedData); // Propagate update to parent
      setShowAdminPanel(false);
    } catch (error) {
      console.error('Error verifying loobricate update:', error);
      setLoginError('Failed to verify changes. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdminPanelClose = () => {
    if (isUpdating) return;
    setShowAdminPanel(false);
  };

  return (
    <div className="add-entry-container">
      <div className="form-container loobricate-profile-container">
        {showAdminPanel ? (
          <LoobricateAdminPanel
            loobricateId={currentLoobricate._id}
            onClose={handleAdminPanelClose}
            onUpdate={handleUpdate}
            onViewProfile={() => setShowAdminPanel(false)}
          />
        ) : showLoginForm ? (
          <div className="login-form-container">
            <div className="form-header">
              <h2>Admin Login</h2>
              <button 
                className="close-button" 
                onClick={() => {
                  setShowLoginForm(false);
                  setLoginError('');
                  setUsername('');
                  setPassword('');
                }}
              >
                ×
              </button>
            </div>
            <div className="login-form-subtitle">
              {currentLoobricate.name}
            </div>
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <FaUserCircle className="input-icon" />
                <input
                  type="text"
                  placeholder="Admin Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input with-icon"
                  required
                />
              </div>
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input with-icon"
                  required
                />
              </div>
              {loginError && (
                <div className="error-container">
                  <p className="error-message">{loginError}</p>
                </div>
              )}
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="loobricate-header">
              <h2>{currentLoobricate.name}</h2>
              <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="main-content">
              <div className="description-section">
                <p className="description">{currentLoobricate.description}</p>
              </div>

              <div className="visualization-container">
                {showVibeComparison ? (
                  <div className="vibe-comparison">
                    <div className="vibe-entity-wrapper">
                      <h3>Loobricate Vibe</h3>
                      <VibeEntity 
                        entityId={currentLoobricate._id}
                        className="loobricate-vibe-entity"
                        onStateUpdate={async (state) => {
                          try {
                            await fetch('/api/vibe_entities', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: currentLoobricate._id, state })
                            });
                          } catch (error) {
                            console.error('Failed to update vibe state:', error);
                          }
                        }}
                      />
                    </div>
                    <div className="vibe-entity-wrapper">
                      <h3>Your Vibe</h3>
                      <VibeEntity 
                        entityId={userId || 'default'}
                        className="user-vibe-entity"
                        onStateUpdate={async (state) => {
                          try {
                            await fetch('/api/vibe_entities', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: userId, state })
                            });
                          } catch (error) {
                            console.error('Failed to update vibe state:', error);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="single-vibe">
                    <VibeEntity 
                      entityId={currentLoobricate._id}
                      className="loobricate-vibe-entity"
                      onStateUpdate={async (state) => {
                        try {
                          await fetch('/api/vibe_entities', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: currentLoobricate._id, state })
                          });
                        } catch (error) {
                          console.error('Failed to update vibe state:', error);
                        }
                      }}
                    />
                  </div>
                )}
                <button 
                  className="compare-vibes-button"
                  onClick={() => setShowVibeComparison(!showVibeComparison)}
                >
                  {showVibeComparison ? 'Hide Comparison' : 'Compare Vibes'}
                </button>
              </div>

              <div className="loobricate-info">
                <div className="info-section members-section">
                  <div className="stat">
                    <span className="label">Members</span>
                    <span className="value">{currentLoobricate.members.length}</span>
                  </div>
                </div>

                {currentLoobricate.tags && currentLoobricate.tags.length > 0 && (
                  <div className="info-section tags-section">
                    <div className="tags-display">
                      {currentLoobricate.tags.map((tag, index) => (
                        <span key={`${tag}-${index}`} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {currentLoobricate.addressLine1 && (
                  <div className="info-section location-section">
                    <p className="location">
                      {currentLoobricate.addressLine1}
                      {currentLoobricate.city && <>, {currentLoobricate.city}</>}
                    </p>
                  </div>
                )}
              </div>

              <div className="admin-login-section">
                <button
                  className="admin-login-button"
                  onClick={() => setShowLoginForm(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Admin Login'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoobricateProfile; 