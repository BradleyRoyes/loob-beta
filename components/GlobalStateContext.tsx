"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Loobricate {
  id: string;
  name: string;
  description: string;
  address: string;
  adminUsername: string;
  tags: string[];
  email?: string;
  location?: string;
  type?: string;
  members?: string[];
  admins?: string[];
}

interface UserState {
  userId: string | null;
  pseudonym: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
  connectedLoobricates: Loobricate[];
  activeLoobricate: Loobricate | null;
}

interface GlobalState extends UserState {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  setUserState: (state: Partial<UserState>) => void;
  clearUserState: () => void;
  setActiveLoobricate: (loobricate: Loobricate | null) => void;
  setConnectedLoobricates: (loobricates: Loobricate[]) => void;
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
    activeLoobricate: null
  });

  // Move localStorage initialization to useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem('sessionId');
      setSessionIdState(storedSession || `session-${Math.random().toString(36).substr(2, 12)}`);

      const storedState = localStorage.getItem('userState');
      if (storedState) {
        setUserStateData(JSON.parse(storedState));
      }
    }
  }, []);

  // Update localStorage when state changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem('userState', JSON.stringify(userState));
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

  const setSessionId = (id: string | null) => {
    setSessionIdState(id);
    if (id) {
      localStorage.setItem('sessionId', id);
    } else {
      localStorage.removeItem('sessionId');
    }
  };

  const setUserState = (newState: Partial<UserState>) => {
    setUserStateData(prev => {
      const updated = { ...prev, ...newState };
      // Update isAnonymous based on userId
      updated.isAnonymous = !updated.userId || updated.userId.startsWith(ANONYMOUS_PREFIX);
      return updated;
    });
  };

  const clearUserState = () => {
    setUserStateData({
      userId: null,
      pseudonym: null,
      email: null,
      phone: null,
      isAnonymous: true,
      connectedLoobricates: [],
      activeLoobricate: null
    });
    localStorage.removeItem('userState');
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
