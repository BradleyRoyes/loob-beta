import PromptSuggestionButton from "./PromptSuggestionButton";
import { useGlobalState } from "../GlobalStateContext";

const servitorPrompts = {
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
  ],
  'servitor-trainer': [
    "Help me create a custom companion",
    "How do I train my companion?",
    "What are companion traits?"
  ]
};

const PromptSuggestionRow = ({ onPromptClick }) => {
  const { activeServitor, isAnonymous } = useGlobalState();
  
  // Default prompts for anonymous users or when no Servitor is selected
  const defaultPrompts = [
    "Tell me more about Loob",
    "Help me find gear for my event",
    "I want to leave feedback"
  ];

  const prompts = (!isAnonymous && activeServitor?.id) 
    ? servitorPrompts[activeServitor.id] || defaultPrompts
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
