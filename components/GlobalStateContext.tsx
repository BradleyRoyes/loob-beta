"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface GlobalState {
  sessionId: string | null;
  userId: string | null;
  pseudonym: string | null;
  email: string | null;
  phone: string | null;
  setSessionId: (id: string | null) => void;
  setUserId: (id: string | null) => void;
  setPseudonym: (pseudonym: string | null) => void;
  setUserEmail: (email: string | null) => void; // Ensure this exists
  setUserPhone: (phone: string | null) => void; // Ensure this exists
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionIdState] = useState<string | null>(
    `session-${Math.random().toString(36).substr(2, 12)}`
  );
  const [userId, setUserIdState] = useState<string | null>(null);
  const [pseudonym, setPseudonymState] = useState<string | null>(null);
  const [email, setEmailState] = useState<string | null>(null);
  const [phone, setPhoneState] = useState<string | null>(null);

  const setSessionId = (id: string | null) => setSessionIdState(id);
  const setUserId = (id: string | null) => setUserIdState(id);
  const setPseudonym = (pseudonym: string | null) => setPseudonymState(pseudonym);
  const setUserEmail = (email: string | null) => setEmailState(email); // Fix for email
  const setUserPhone = (phone: string | null) => setPhoneState(phone); // Fix for phone

  return (
    <GlobalStateContext.Provider
      value={{
        sessionId,
        userId,
        pseudonym,
        email,
        phone,
        setSessionId,
        setUserId,
        setPseudonym,
        setUserEmail, // Ensure this is provided
        setUserPhone, // Ensure this is provided
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
