const PromptSuggestionButton = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-sm py-2 px-4 rounded-lg 
        bg-transparent border border-pink-200/30 text-pink-300/90
        hover:bg-pink-100/5 hover:border-pink-200/50 
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-pink-200/20
        overflow-hidden whitespace-nowrap"
    >
      {text}
    </button>
  );
};

export default PromptSuggestionButton;
