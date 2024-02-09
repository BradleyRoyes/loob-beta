// AnalyseButton.tsx
import React from "react";

interface AnalyseButtonProps {
  onClick: (message: string) => void; // Define onClick prop to pass message to parent
}

const AnalyseButton: React.FC<AnalyseButtonProps> = ({ onClick }) => {
  const handleButtonClick = () => {
    // Define the message to be sent when the button is clicked
    const analyseMessage = "Analyse our conversation so far";
    onClick(analyseMessage); // Pass the message to the parent component
  };

  return (
    <button
      onClick={handleButtonClick}
      className="prompt-button text-sm py-2 px-4 rounded-lg overflow-hidden whitespace-nowrap focus:outline-none focus:shadow-outline"
    >
      Analyse {/* Display the button text */}
    </button>
  );
};

export default AnalyseButton;
