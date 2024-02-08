import React, { createContext, useContext, useState, useEffect } from 'react';

const UsernameContext = createContext();

export const UsernameProvider = ({ children }) => {
  // Initialize state without directly calling localStorage
  const [username, setUsername] = useState('');

  // Effect hook to handle localStorage
  useEffect(() => {
    // Check if window is defined (i.e., if running in a client environment)
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }
  }, []);

  useEffect(() => {
    // Save to localStorage when username changes, checking if window is defined
    if (typeof window !== 'undefined' && username) {
      localStorage.setItem('username', username);
    }
  }, [username]);

  const saveUsername = (newUsername) => {
    setUsername(newUsername);
  };

  return (
    <UsernameContext.Provider value={{ username, saveUsername }}>
      {children}
    </UsernameContext.Provider>
  );
};

export const useUsername = () => useContext(UsernameContext);
