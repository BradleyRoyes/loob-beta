'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalState {
  sessionId: string | null; // Session ID can be null
  userId: string | null; // User ID can be null
  setSessionId: (id: string | null) => void; // Accept null for resetting session ID
  setUserId: (id: string | null) => void; // Accept null for resetting user ID
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);

  const setSessionId = (id: string | null) => setSessionIdState(id);
  const setUserId = (id: string | null) => setUserIdState(id);

  return (
    <GlobalStateContext.Provider value={{ sessionId, userId, setSessionId, setUserId }}>
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
