import React from "react";

interface AnalyseButtonProps {
  onClick: () => void;
}

const AnalyseButton: React.FC<AnalyseButtonProps> = ({ onClick }) => {
  const handleAnalyseButtonClick = () => {
    // Define the behavior for the button click here
    // For example:
    console.log("Analyse button clicked");
    onClick(); // Call the provided onClick function
  };

  return (
    <button
      onClick={handleAnalyseButtonClick} // Use the local handler function
      className="button-dash flex rounded-md items-center justify-center px-2.5"
      style={{ fontWeight: "500" }}
    >
      Analyse
    </button>
  );
};

export default AnalyseButton;
