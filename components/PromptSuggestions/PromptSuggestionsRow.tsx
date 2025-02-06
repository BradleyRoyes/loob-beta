import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({ onPromptClick }) => {
  const prompts = [
    "Tell me more about Loob",
    "Help me find gear for my event",
    "I want to leave feedback"
  ];
  
  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-3 py-6 px-2 opacity-90">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionRow;
