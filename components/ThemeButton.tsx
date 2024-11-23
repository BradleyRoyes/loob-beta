"use client";

import { useEffect, useState } from "react";

const ToggleButton = () => {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const getLocalValue = () => {
      const storedValue = localStorage.getItem('theme');
      if (storedValue !== null) {
        return storedValue;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const initialTheme = getLocalValue();
    setTheme(initialTheme);

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (theme !== null) {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (theme === null) {
    return null;
  }

  return (
    <button onClick={handleToggle}>
      {theme === 'dark' ? (
          <svg aria-label="Light Mode" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* SVG path for light mode */}
          </svg>
        ): (
          <svg aria-label="Dark Mode" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* SVG path for dark mode */}
          </svg>
        )
      }
    </button>
  )
};

export default ToggleButton;
