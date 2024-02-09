// SplashScreen.tsx
import React from 'react';

interface SplashScreenProps {
  onEnter: () => void; // Function to run when the enter button is clicked
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-white z-50">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Loob Laboratories</h1>
        <button
          onClick={onEnter}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
