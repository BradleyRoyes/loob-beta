import PromptSuggestionButton from "./PromptSuggestionButton";
import { useGlobalState } from "../GlobalStateContext";

const servitorPrompts = {
  'logis': [
    "Help me plan an event",
    "I need to track resources",
    "Optimize my event logistics"
  ],
  'harmoni': [
    "Guide me in vibe curation",
    "Help with harm reduction",
    "Support my integration process"
  ],
  'nexus': [
    "Connect me with resources",
    "Help build collaborations",
    "Map community connections"
  ]
};

// Updated anonymous user prompts
const defaultPrompts = [
  "Find underground events near me",
  "Connect me with local resources",
  "Learn about harm reduction",
  "Discover community spaces"
];

const PromptSuggestionRow = ({ onPromptClick }) => {
  const { activeServitor, isAnonymous } = useGlobalState();
  
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
