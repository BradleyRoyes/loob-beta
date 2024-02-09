import React from "react";

interface AnalyseButtonProps {
  onClick: () => void;
}

const AnalyseButton: React.FC<AnalyseButtonProps> = ({ onClick }) => {
 const handleAnalyseButtonClick = () => {
  const analyseMessage = "analyse our conversation until now";
  append({ author: "user", content: analyseMessage }); // Send the message to the chat
  // Optionally, you can also clear the input field after sending the message
  handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
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
