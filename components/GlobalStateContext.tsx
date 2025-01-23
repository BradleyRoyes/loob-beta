"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserState {
  userId: string | null;
  pseudonym: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
}

interface GlobalState extends UserState {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  setUserState: (state: Partial<UserState>) => void;
  clearUserState: () => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

const ANONYMOUS_PREFIX = 'anon-';

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [userState, setUserStateData] = useState<UserState>({
    userId: null,
    pseudonym: null,
    email: null,
    phone: null,
    isAnonymous: true
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
      isAnonymous: true
    });
    localStorage.removeItem('userState');
  };

  return (
    <GlobalStateContext.Provider
      value={{
        ...userState,
        sessionId,
        setSessionId,
        setUserState,
        clearUserState
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
