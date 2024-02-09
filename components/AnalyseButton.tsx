import React from "react";
import { useChat } from "ai/react";

const ThemeButton: React.FC = () => {
  const { append } = useChat();

  const handleAnalyse = () => {
    append("**analyse our conversation**");
  };

  return (
    <button
      onClick={handleAnalyse}
      className="button-dash flex rounded-md items-center justify-center px-2.5"
      style={{ fontWeight: "500" }}
    >
      Analyse
    </button>
  );
};

export default ThemeButton;
