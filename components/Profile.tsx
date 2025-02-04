'use client';

import React, { useEffect, useState } from 'react';
import TorusSphere from './TorusSphere';
import './Profile.css';
import LoobricateProfile from './LoobricateProfile';
import LoobricateAdminPanel from './LoobricateAdminPanel';
import { useGlobalState } from './GlobalStateContext';
import type { Loobricate } from './GlobalStateContext';
import type { LoobricateData } from '../types/loobricate';
import DailyDump from './DailyDump';
import DailyQuest from './DailyQuest';

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
    members: loobricate.members || [],
    admins: loobricate.admins || [],
    createdAt: new Date().toISOString(),
    type: loobricate.type || 'community'
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
  const [showDailyDump, setShowDailyDump] = useState(false);
  const [showDailyQuest, setShowDailyQuest] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasDumpedToday, setHasDumpedToday] = useState(false);

  // Remove duplicate state
  const [selectedLoobricate, setSelectedLoobricate] = useState<Loobricate | null>(null);
  const [showLoobricateModal, setShowLoobricateModal] = useState(false);

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

  // Update badge click handler
  const handleLoobricateClick = (loobricate: Loobricate) => {
    setSelectedLoobricate(loobricate);
    setShowLoobricateModal(true);
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

  return (
    <div className="profile-container">
      {/* Connected Loobricates Section */}
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
            <div className="connected-loobricates mt-4">
              {connectedLoobricates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {connectedLoobricates.map((loobricate) => (
                    <button
                      key={loobricate.id}
                      onClick={() => handleLoobricateClick(loobricate)}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-800 text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 hover:translate-y-[-1px]"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">
                        {loobricate.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{loobricate.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
            {hasDumpedToday && (
              <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                ✓ Done Today
              </span>
            )}
          </button>
          <p className="helper-text">
            Share thoughts and goals to help Loob understand you better.
          </p>

          <button 
            onClick={() => setShowDailyQuest(true)}
            className={`daily-quest-button ${!hasDumpedToday ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasDumpedToday}
          >
            Daily Quest
            {!hasDumpedToday && (
              <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 border border-gray-600">
                Locked
              </span>
            )}
          </button>
          <p className="helper-text">
            {hasDumpedToday 
              ? "Receive a mystical quest based on your journey so far."
              : "Complete a Daily Dump first to unlock your quest."}
          </p>
        </div>

        {/* Recent Discoveries with Map Links */}
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
          <button className="logout-button" onClick={handleLogOut}>
            Log Out
          </button>
        </div>
      </div>

      {/* Loobricate Profile Modal */}
      {showLoobricateModal && selectedLoobricate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <LoobricateProfile
            loobricate={convertToLoobricateData(selectedLoobricate)}
            onClose={handleModalClose}
            onUpdate={handleLoobricateUpdate}
          />
        </div>
      )}

      {/* Other modals */}
      {showDailyDump && (
        <DailyDump 
          isOpen={showDailyDump}
          onClose={() => setShowDailyDump(false)}
          onDumpComplete={() => {
            setHasDumpedToday(true);
          }}
        />
      )}

      {showDailyQuest && (
        <DailyQuest 
          hasDumpedToday={hasDumpedToday}
          onOpenDump={() => {
            setShowDailyQuest(false);
            setShowDailyDump(true);
          }}
          onClose={() => setShowDailyQuest(false)}
        />
      )}
    </div>
  );
};

export default Profile;
