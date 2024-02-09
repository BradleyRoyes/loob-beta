// AnalyseButton.tsx
import React from "react";
import { useChat } from "ai/react";

const defaultAnalyseMessage = "Analyse our conversation until now";

const AnalyseButton: React.FC = () => {
  const { append } = useChat();

  const handleButtonClick = () => {
    append({ author: "user", content: defaultAnalyseMessage }); // Append the default message to the chat
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
