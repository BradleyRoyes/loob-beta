// AnalyseButton.tsx
import React from "react";
import { useChat, CreateMessage } from "ai/react"; // Import CreateMessage type from your chat library

const defaultAnalyseMessage = "Analyse our conversation until now"; // Define the default message here

const AnalyseButton: React.FC = () => {
  const { append } = useChat();

  const handleButtonClick = () => {
    const message: CreateMessage = {
      content: defaultAnalyseMessage,
    };
    append(message); // Append the default message to the chat
  };

  return (
    <button
      onClick={handleButtonClick}
      className="button-dash flex rounded-md items-center justify-center px-2.5"
      style={{ fontWeight: "500" }}
    >
      {defaultAnalyseMessage} {/* Display the default message */}
    </button>
  );
};

export default AnalyseButton;
