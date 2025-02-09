import PromptSuggestionButton from "./PromptSuggestionButton";
import { useGlobalState } from "../GlobalStateContext";

const tulpaPrompts = {
  'harm-reduction': [
    "Help me plan a safe experience",
    "What should I know about set and setting?",
    "How can I integrate my experiences?"
  ],
  'citizen-science': [
    "Start documenting an experience",
    "Help me structure my observations",
    "Contribute to research data"
  ],
  'loobrary-matcher': [
    "Tell me more about Loob",
    "Help me find gear for my event",
    "I want to leave feedback"
  ]
};

const PromptSuggestionRow = ({ onPromptClick }) => {
  const { activeTulpa, isAnonymous } = useGlobalState();
  
  // Default prompts for anonymous users or when no Tulpa is selected
  const defaultPrompts = [
    "Tell me more about Loob",
    "Help me find gear for my event",
    "I want to leave feedback"
  ];

  const prompts = (!isAnonymous && activeTulpa?.id) 
    ? tulpaPrompts[activeTulpa.id] || defaultPrompts
    : defaultPrompts;
  
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
