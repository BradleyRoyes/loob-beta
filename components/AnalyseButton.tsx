// AnalyseButton.tsx
import React from "react";
import { useChat, CreateMessage } from "ai/react";

const defaultAnalyseMessage = "Analyse our conversation until now";

const AnalyseButton: React.FC = () => {
  const { append } = useChat();

  const handleButtonClick = () => {
    const message: CreateMessage = {
      id: "unique-id", // Provide a unique identifier
      content: defaultAnalyseMessage,
      role: "user",
    };
    append(message);
  };

  return (
    <button
      onClick={handleButtonClick}
      className="button-dash flex rounded-md items-center justify-center px-2.5"
      style={{ fontWeight: "500" }}
    >
      {defaultAnalyseMessage}
    </button>
  );
};

export default AnalyseButton;
