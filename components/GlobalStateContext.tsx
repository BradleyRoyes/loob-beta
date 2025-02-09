"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Tulpa } from './TulpaManager';

export type Loobricate = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  adminUsername?: string;
  tags?: string[];
  type?: string;
  members?: string[];
  admins?: string[];
  email?: string;
  location?: { lat: number; lng: number };
  role?: 'admin' | 'member';
};

interface UserState {
  userId: string | null;
  pseudonym: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
  connectedLoobricates: Loobricate[];
  activeLoobricate: Loobricate | null;
  activeTulpa: Tulpa | null;
}

interface GlobalState extends UserState {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  setUserState: (state: Partial<UserState>) => void;
  clearUserState: () => void;
  setActiveLoobricate: (loobricate: Loobricate | null) => void;
  setConnectedLoobricates: (loobricates: Loobricate[]) => void;
  setActiveTulpa: (tulpa: Tulpa | null) => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

const ANONYMOUS_PREFIX = 'anon-';

const fetchConnectedLoobricates = async (userId: string) => {
  try {
    const response = await fetch(`/api/users/${userId}/data`);
    const data = await response.json();
    
    if (response.ok && data.connectedLoobricates) {
      return data.connectedLoobricates;
    }
    return [];
  } catch (error) {
    console.error('Error fetching connected loobricates:', error);
    return [];
  }
};

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [userState, setUserStateData] = useState<UserState>({
    userId: null,
    pseudonym: null,
    email: null,
    phone: null,
    isAnonymous: true,
    connectedLoobricates: [],
    activeLoobricate: null,
    activeTulpa: null
  });

  // Initialize state from localStorage with logging
  useEffect(() => {
    const initializeState = () => {
      console.log('Initializing GlobalStateContext...');
      const storedState = localStorage.getItem('userState');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      
      console.log('Stored login state:', { isLoggedIn, storedState });
      
      if (storedState && isLoggedIn === 'true') {
        try {
          const parsedState = JSON.parse(storedState);
          console.log('Found stored user state:', parsedState);
          setUserStateData(parsedState);
        } catch (error) {
          console.error('Error parsing stored state:', error);
          localStorage.removeItem('userState');
          localStorage.removeItem('isLoggedIn');
        }
      } else {
        console.log('No stored user state found or user not logged in');
      }
    };

    initializeState();
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    if (userState.userId) {
      localStorage.setItem('userState', JSON.stringify(userState));
    }
  }, [userState]);

  // Update useEffect to fetch connected loobricates when userId changes
  useEffect(() => {
    if (userState.userId && !userState.userId.startsWith(ANONYMOUS_PREFIX)) {
      fetchConnectedLoobricates(userState.userId).then(loobricates => {
        setUserStateData(prev => ({
          ...prev,
          connectedLoobricates: loobricates
        }));
      });
    }
  }, [userState.userId]);

  // Log state changes
  useEffect(() => {
    console.log('GlobalStateContext - Current User State:', userState);
  }, [userState]);

  const setSessionId = (id: string | null) => {
    setSessionIdState(id);
    if (id) {
      localStorage.setItem('sessionId', id);
    } else {
      localStorage.removeItem('sessionId');
    }
  };

  const setUserState = (newState: Partial<UserState>) => {
    console.log('Setting new user state:', newState);
    setUserStateData(prev => {
      const updated = { ...prev, ...newState };
      updated.isAnonymous = !updated.userId || updated.userId.startsWith(ANONYMOUS_PREFIX);
      
      // Only persist if user is logged in
      if (!updated.isAnonymous) {
        localStorage.setItem('userState', JSON.stringify(updated));
        console.log('Updated GlobalStateContext - Full User State:', updated);
      }
      
      return updated;
    });
  };

  const clearUserState = () => {
    console.log('Clearing user state...');
    setUserStateData({
      userId: null,
      pseudonym: null,
      email: null,
      phone: null,
      isAnonymous: true,
      connectedLoobricates: [],
      activeLoobricate: null,
      activeTulpa: null
    });
    localStorage.removeItem('userState');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('sessionId');
    console.log('User state cleared');
  };

  const setActiveLoobricate = (loobricate: Loobricate | null) => {
    setUserStateData(prev => ({
      ...prev,
      activeLoobricate: loobricate
    }));
  };

  const setConnectedLoobricates = (loobricates: Loobricate[]) => {
    setUserStateData(prev => ({
      ...prev,
      connectedLoobricates: loobricates
    }));
  };

  const setActiveTulpa = (tulpa: Tulpa | null) => {
    setUserStateData(prev => ({
      ...prev,
      activeTulpa: tulpa
    }));
  };

  return (
    <GlobalStateContext.Provider
      value={{
        ...userState,
        sessionId,
        setSessionId,
        setUserState,
        clearUserState,
        setActiveLoobricate,
        setConnectedLoobricates,
        setActiveTulpa,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = (): GlobalState => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
};
