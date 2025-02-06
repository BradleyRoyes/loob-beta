'use client';

import React, { useEffect, useState } from 'react';
import './Profile.css';
import LoobricateProfile from './LoobricateProfile';
import LoobricateAdminPanel from './LoobricateAdminPanel';
import { useGlobalState } from './GlobalStateContext';
import type { Loobricate } from './GlobalStateContext';
import type { LoobricateData } from '../types/loobricate';
import DailyDump from './DailyDump';
import DailyQuest from './DailyQuest';
import VibeEntity from './VibeEntity';

// Conversion helper
const convertToLoobricate = (data: LoobricateData): Loobricate => ({
  id: data._id,
  name: data.name,
  description: data.description,
  address: `${data.addressLine1}, ${data.city}`,
  adminUsername: data.adminUsername,
  tags: data.tags,
  type: data.type,
  members: data.members,
  admins: data.admins,
  email: undefined,
  location: undefined
});

const convertToLoobricateData = (loobricate: Loobricate): LoobricateData => {
  const [addressLine1, city] = loobricate.address?.split(', ') || ['', ''];
  return {
    _id: loobricate.id,
    name: loobricate.name,
    description: loobricate.description || '',
    addressLine1,
    city,
    adminUsername: loobricate.adminUsername || '',
    tags: loobricate.tags || [],
    type: loobricate.type || 'community',
    members: loobricate.members || [],
    admins: loobricate.admins || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active'
  };
};

// Add type for the connected loobricate from API
interface ConnectedLoobricate {
  id: string;
  name: string;
  type: string;
  role: string;
}

const Profile: React.FC<{
  toggleView?: (view: "Chat" | "Profile" | "Map" | "NFCReader" | "AddEntry") => void;
}> = ({ toggleView }) => {
  const { 
    userId, 
    pseudonym,
    email,
    phone, 
    isAnonymous, 
    clearUserState,
    connectedLoobricates: rawConnectedLoobricates,
    setConnectedLoobricates: setRawConnectedLoobricates,
    setUserState
  } = useGlobalState();

  const [entries, setEntries] = useState<any[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<any[]>([]);
  const [routeMessage, setRouteMessage] = useState('');
  const [showDailyDumpModal, setShowDailyDumpModal] = useState(false);
  const [showDailyQuestModal, setShowDailyQuestModal] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasDumpedToday, setHasDumpedToday] = useState(false);

  // Remove duplicate state
  const [selectedLoobricate, setSelectedLoobricate] = useState<Loobricate | null>(null);
  const [showLoobricateModal, setShowLoobricateModal] = useState(false);
  const [isLoobricateLoading, setIsLoobricateLoading] = useState(false);

  // Transform raw loobricates into normalized form, handling potential invalid data
  const connectedLoobricates = React.useMemo(() => 
    (rawConnectedLoobricates || [])
      .map(loobricate => {
        // Handle string IDs (temporary data) silently
        if (typeof loobricate === 'string') return null;
        
        // Ensure loobricate object has required fields
        if (!loobricate?.id || !loobricate?.name) {
          console.debug('Skipping invalid loobricate:', loobricate);
          return null;
        }
        
        return {
          id: loobricate.id,
          name: loobricate.name,
          description: loobricate.description || '',
          address: loobricate.address || '',
          adminUsername: loobricate.adminUsername || '',
          tags: loobricate.tags || [],
          type: loobricate.type || 'community',
          members: loobricate.members || [],
          admins: loobricate.admins || [],
          email: undefined,
          location: undefined
        } as Loobricate;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)
  , [rawConnectedLoobricates]);

  useEffect(() => {
    const fetchUserData = async () => {
      // Skip if we've already loaded the data
      if (hasLoadedInitialData) return;

      // Handle anonymous users
      if (isAnonymous || !userId || userId.startsWith('anon-')) {
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
            JSON.stringify(data.connectedLoobricates) !== JSON.stringify(rawConnectedLoobricates);

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
          // Clear anonymous message if it was set
          setRouteMessage('');
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
  }, [userId, isAnonymous, hasLoadedInitialData, pseudonym, email, phone, rawConnectedLoobricates, setUserState]);

  // Add effect to check if user has dumped today
  useEffect(() => {
    const checkDumpStatus = async () => {
      if (!userId || userId.startsWith('anon-')) return;
      
      try {
        const response = await fetch(`/api/daily-dumps/today?userId=${userId}`);
        const data = await response.json();
        setHasDumpedToday(data.hasDumped);
      } catch (error) {
        console.error('Error checking dump status:', error);
      }
    };

    checkDumpStatus();
  }, [userId]);

  // Log Out Button Handler
  const handleLogOut = () => {
    clearUserState();
    window.location.reload();
  };

  // Placeholder for button clicks
  const handlePlaceholderClick = () => {
    alert('Feature coming soon!');
  };

  // Update the handleLoobricateClick function
  const handleLoobricateClick = async (loobricate: Loobricate) => {
    setIsLoobricateLoading(true);
    setShowLoobricateModal(true);
    
    try {
      // Fetch fresh data from the server
      const response = await fetch(`/api/loobricates/${loobricate.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Loobricate data');
      }
      const freshData = await response.json();
      
      // Update the selected Loobricate with fresh data
      setSelectedLoobricate({
        ...loobricate,
        members: freshData.members || [],
        admins: freshData.admins || [],
        description: freshData.description || loobricate.description || '',
        tags: freshData.tags || loobricate.tags || []
      });
    } catch (error) {
      console.error('Error fetching Loobricate details:', error);
      // Fallback to existing data if fetch fails
      setSelectedLoobricate(loobricate);
    } finally {
      setIsLoobricateLoading(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedLoobricate(null);
    setShowLoobricateModal(false);
  };

  // Handle Loobricate update
  const handleLoobricateUpdate = (updatedData: LoobricateData) => {
    if (!selectedLoobricate) return;

    // Update the loobricate in the global state
    const updatedLoobricates = rawConnectedLoobricates.map(l => {
      if (typeof l === 'string') return l;
      return l.id === updatedData._id ? {
        ...l,
        name: updatedData.name,
        description: updatedData.description,
        address: `${updatedData.addressLine1}, ${updatedData.city}`,
        adminUsername: updatedData.adminUsername,
        tags: updatedData.tags,
        members: updatedData.members,
        admins: updatedData.admins,
        type: updatedData.type
      } : l;
    });

    setRawConnectedLoobricates(updatedLoobricates);
    setSelectedLoobricate(prevState => 
      prevState ? {
        ...prevState,
        name: updatedData.name,
        description: updatedData.description,
        address: `${updatedData.addressLine1}, ${updatedData.city}`,
        adminUsername: updatedData.adminUsername,
        tags: updatedData.tags,
        members: updatedData.members,
        admins: updatedData.admins,
        type: updatedData.type
      } : null
    );
  };

  // Add placeholder badges for anonymous users
  const placeholderBadges = [
    { id: '1', name: '?' },
    { id: '2', name: '?' },
    { id: '3', name: '?' }
  ];

  const handleLoginClick = () => {
    window.location.reload();
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <div className="profile-header">
          <div className="pseudonym-section">
            <div className="pseudonym-container">
              <p className="pseudonym-label">Pseudonym:</p>
              <p className="pseudonym-value">
                {isAnonymous ? 'Anonymous User' : pseudonym}
              </p>
            </div>
            
            {/* Connected Loobricates Section */}
            <div className="connected-loobricates">
              {isAnonymous ? (
                <div className="anonymous-loobricates">
                  <div className="badges-container">
                    {placeholderBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="badge-placeholder"
                      >
                        <div className="badge-avatar">?</div>
                        <span className="badge-name">Loobricate</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : connectedLoobricates.length > 0 ? (
                <div className="badges-container">
                  {connectedLoobricates.map((loobricate) => (
                    <button
                      key={loobricate.id}
                      onClick={() => handleLoobricateClick(loobricate)}
                      className="loobricate-badge"
                    >
                      <div className="badge-avatar">
                        {loobricate.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="badge-name">{loobricate.name}</span>
                      {loobricate.role === 'admin' && (
                        <span className="admin-indicator">Admin</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-loobricates">
                  <p>You haven't joined any Loobricates yet</p>
                  <button 
                    onClick={() => toggleView && toggleView("AddEntry")}
                    className="add-loobricate-button"
                  >
                    Find Loobricates
                  </button>
                </div>
              )}
            </div>
          </div>
          {routeMessage && <p className="route-message">{routeMessage}</p>}
        </div>

        <div className="visualization-container">
          <VibeEntity 
            entityId={userId || 'default'} 
            className="profile-vibe-entity"
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

        {/* For anonymous users, show welcome message */}
        {isAnonymous ? (
          <div className="anonymous-message">
            <h2>Welcome to Loob!</h2>
            <p>Join our community to unlock all features:</p>
            <ul>
              <li>Connect with Loobricates in your area</li>
              <li>Track your daily journey with Dumps and Quests</li>
              <li>Discover and share new experiences</li>
              <li>Build your personal Loobrary</li>
            </ul>
            <button 
              onClick={handleLoginClick}
              className="loobricate-login-button"
            >
              Log In to Get Started
            </button>
          </div>
        ) : (
          <>
            {/* Daily Challenges Section */}
            <div className="daily-section">
              <div className="daily-buttons-container">
                <div>
                  <button
                    className="daily-dump-button"
                    onClick={() => setShowDailyDumpModal(true)}
                    disabled={hasDumpedToday}
                  >
                    Daily Dump
                    {hasDumpedToday && (
                      <span className="completion-indicator">✓ Done Today</span>
                    )}
                  </button>
                  <p className="helper-text">
                    Share thoughts and goals to help Loob understand you better.
                  </p>
                </div>
                <div>
                  <button
                    className={`daily-quest-button ${!hasDumpedToday ? 'locked' : ''}`}
                    onClick={() => setShowDailyQuestModal(true)}
                    disabled={!hasDumpedToday}
                  >
                    Daily Quest
                    {!hasDumpedToday && (
                      <span className="lock-indicator">Locked</span>
                    )}
                  </button>
                  <p className="helper-text">
                    {hasDumpedToday 
                      ? "Receive a mystical quest based on your journey so far."
                      : "Complete a Daily Dump first to unlock your quest."}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Discoveries Section */}
            <div className="profile-section">
              <h2 className="section-heading">Recent Discoveries</h2>
              {recentDiscoveries.length > 0 ? (
                <ul className="list">
                  {recentDiscoveries.map((r) => (
                    <li key={r.id} className="list-item">
                      <div className="list-item-content">
                        <span>{r.title}</span>
                        <p>Visited on: {new Date(r.dateVisited).toLocaleDateString()}</p>
                      </div>
                      <div className="button-group">
                        <button 
                          className="inline-button"
                          onClick={() => toggleView && toggleView("Map")}
                        >
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

            {/* Recent Entries Section */}
            <div className="profile-section">
              <h2 className="section-heading">Recent Entries</h2>
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

        {/* Buttons Container */}
        <div className="buttons-container">
          <div className="button-group">
            {!isAnonymous && (
              <button className="logout-button" onClick={handleLogOut}>
                Log Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDailyDumpModal && !isAnonymous && (
        <div className={`modal-overlay ${showDailyDumpModal ? 'visible' : ''}`}>
          <DailyDump 
            isOpen={showDailyDumpModal}
            onClose={() => setShowDailyDumpModal(false)}
            onDumpComplete={() => {
              setHasDumpedToday(true);
              setShowDailyDumpModal(false);
            }}
          />
        </div>
      )}

      {showDailyQuestModal && !isAnonymous && (
        <div className={`modal-overlay ${showDailyQuestModal ? 'visible' : ''}`}>
          <DailyQuest 
            hasDumpedToday={hasDumpedToday}
            onOpenDump={() => {
              setShowDailyQuestModal(false);
              setShowDailyDumpModal(true);
            }}
            onClose={() => setShowDailyQuestModal(false)}
          />
        </div>
      )}

      {showLoobricateModal && (
        <div className={`modal-overlay ${showLoobricateModal ? 'visible' : ''}`}>
          {isLoobricateLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading Loobricate...</p>
            </div>
          ) : selectedLoobricate && (
            selectedLoobricate.admins?.includes(userId || '') ? (
              <LoobricateAdminPanel
                loobricateId={selectedLoobricate.id}
                onClose={handleModalClose}
                onUpdate={handleLoobricateUpdate}
              />
            ) : (
              <LoobricateProfile
                loobricate={convertToLoobricateData(selectedLoobricate)}
                onClose={handleModalClose}
                onUpdate={handleLoobricateUpdate}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
