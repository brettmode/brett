interface SuggestionBubblesProps {
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export default function SuggestionBubbles({ onSuggestionClick, isLoading }: SuggestionBubblesProps) {
  const suggestions = [
    "Show me my latest mentions",
    "Help me write an engaging tweet",
    "Analyze my recent tweets",
    "Search for tweets about AI",
    "Search for tweets about crypto",
    "Find trending topics in tech",
    "Show me tweets from @elonmusk",
    "Search for #bitcoin discussions",
    "Find tweets about Web3",
    "Search for startup conversations",
    "Find tweets about DeFi"
  ];

  if (isLoading) return null;

  return (
    <div className="px-6 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-shrink-0 px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
