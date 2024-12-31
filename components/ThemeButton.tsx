"use client";

import { useEffect, useState } from "react";

const ToggleButton: React.FC = () => {
  const [theme, setTheme] = useState<string | null>(null);

  // Set initial theme based on localStorage or system preference
  useEffect(() => {
    const getLocalValue = (): string => {
      const storedValue = localStorage.getItem("theme");
      return storedValue
        ? storedValue
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const initialTheme = getLocalValue();
    setTheme(initialTheme);

    // Apply the initial theme to the document
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  // Update the theme in localStorage and the document class when it changes
  useEffect(() => {
    if (theme !== null) {
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  // Toggle the theme between light and dark
  const handleToggle = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // Return nothing if theme is not yet determined
  if (theme === null) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {theme === "dark" ? (
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Light mode icon */}
          <path
            d="M12 4V2M12 22v-2M4.93 4.93L3.51 3.51M20.49 20.49l-1.42-1.42M22 12h-2M4 12H2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dark mode icon */}
          <path
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

export default ToggleButton;
