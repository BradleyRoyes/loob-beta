"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface GlobalState {
  sessionId: string | null;
  userId: string | null;
  userEmail: string | null;
  userPhone: string | null;
  setSessionId: (id: string | null) => void;
  setUserId: (id: string | null) => void;
  setUserEmail: (email: string | null) => void;
  setUserPhone: (phone: string | null) => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(`session-${Math.random().toString(36).substr(2, 12)}`);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [userPhone, setUserPhoneState] = useState<string | null>(null);

  const setSessionId = (id: string | null) => {
    setSessionIdState(id);
  };

  const setUserId = (id: string | null) => {
    setUserIdState(id);
  };

  const setUserEmail = (email: string | null) => {
    setUserEmailState(email);
  };

  const setUserPhone = (phone: string | null) => {
    setUserPhoneState(phone);
  };

  return (
    <GlobalStateContext.Provider
      value={{
        sessionId,
        userId,
        userEmail,
        userPhone,
        setSessionId,
        setUserId,
        setUserEmail,
        setUserPhone,
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
