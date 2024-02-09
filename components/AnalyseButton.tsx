import React from "react";

interface AnalyseButtonProps {
  onClick: () => void;
}

const AnalyseButton: React.FC<AnalyseButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="button-dash flex rounded-md items-center justify-center px-2.5"
      style={{ fontWeight: "500" }}
    >
      Analyse
    </button>
  );
};

export default AnalyseButton;
