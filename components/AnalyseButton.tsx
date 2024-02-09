// AnalyseButton.js
import React from "react";

const AnalyseButton = ({ onClick }) => {
  const handleButtonClick = () => {
    onClick("Analyse our conversation until now"); // Pass the predefined message to the onClick handler
  };

  return (
    <button
      onClick={handleButtonClick}
      className="button-dash flex rounded-md items-center justify-center px-2.5"
      style={{ fontWeight: "500" }}
    >
      Analyse
    </button>
  );
};

export default AnalyseButton;
