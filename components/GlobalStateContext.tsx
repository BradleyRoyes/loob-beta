'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface GlobalState {
  sessionId: string | null; // Session ID is always present after initialization
  userId: string | null;    // "userId" acts as the user's pseudonym
  setSessionId: (id: string | null) => void;
  setUserId: (id: string | null) => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);

  // Generate a unique session ID when the app initializes
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session-${Math.random().toString(36).substr(2, 12)}`;
      setSessionIdState(newSessionId);
    }
  }, [sessionId]);

  const setSessionId = (id: string | null) => {
    setSessionIdState(id);
  };

  const setUserId = (id: string | null) => {
    setUserIdState(id);
  };

  return (
    <GlobalStateContext.Provider
      value={{ sessionId, userId, setSessionId, setUserId }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = (): GlobalState => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
