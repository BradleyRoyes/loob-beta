// AnalyseButton.tsx
import React from "react";

interface AnalyseButtonProps {
  onClick: (message: string) => void; // Define onClick prop to pass message to parent
}

const AnalyseButton: React.FC<AnalyseButtonProps & { className?: string }> = ({ onClick, className }) => {
  const handleButtonClick = () => {
    // Define the message to be sent when the button is clicked
    const analyseMessage = "Loob request: analyse my messages";
    onClick(analyseMessage); // Pass the message to the parent component
  };

  return (
    <button
      onClick={handleButtonClick}
      className={`button-dash text-sm py-2 px-4 rounded-lg overflow-hidden whitespace-nowrap focus:outline-none focus:shadow-outline ${className || ''}`}
    >
      End Chat {/* Display the button text */}
    </button>
  );
};

export default AnalyseButton;
