'use client';

import React, { useState } from 'react';
import './LoobricateProfile.css';
import TorusSphere from './TorusSphere';
import type { LoobricateData } from '../types/loobricate';
import LoobricateAdminPanel from './LoobricateAdminPanel';
import { FaLock, FaUserCircle } from 'react-icons/fa';

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

            <div className="visualization-section">
              <TorusSphere loobricateId={currentLoobricate._id} />
            </div>

            <div className="loobricate-info">
              <div className="info-section">
                <p className="description">{currentLoobricate.description}</p>
              </div>

              {currentLoobricate.addressLine1 && (
                <div className="info-section">
                  <h3>Location</h3>
                  <p className="description">
                    {currentLoobricate.addressLine1}
                    {currentLoobricate.city && <>, {currentLoobricate.city}</>}
                  </p>
                </div>
              )}

              <div className="info-section">
                <h3>Community</h3>
                <div className="stats">
                  <div className="stat">
                    <span className="label">Members</span>
                    <span className="value">{currentLoobricate.members.length}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Admins</span>
                    <span className="value">{currentLoobricate.admins.length}</span>
                  </div>
                </div>
              </div>

              {currentLoobricate.tags && currentLoobricate.tags.length > 0 && (
                <div className="info-section">
                  <h3>Tags</h3>
                  <div className="tags-display">
                    {currentLoobricate.tags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="info-section">
                <h3>Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Type</span>
                    <span className="value">{currentLoobricate.type || 'Community'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created</span>
                    <span className="value">
                      {new Date(currentLoobricate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Admin</span>
                    <span className="value">{currentLoobricate.adminUsername}</span>
                  </div>
                </div>
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