import React, { useState, useEffect } from 'react';
import { useGlobalState } from './GlobalStateContext';

interface Quest {
  text: string;
  reason?: string;
  completed?: boolean;
}

interface DailyQuestProps {
  hasDumpedToday: boolean;
  onOpenDump: () => void;
  onClose: () => void;
}

const DailyQuest: React.FC<DailyQuestProps> = ({ hasDumpedToday, onOpenDump, onClose }) => {
  const { userId } = useGlobalState();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder function - replace with actual implementation
  const getQuestRecommendation = async (): Promise<Quest> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      text: "Send that email",
      reason: "Mentioned it 3 times this week"
    };
  };

  const fetchQuest = async () => {
    if (!hasDumpedToday) return;
    
    setLoading(true);
    try {
      const newQuest = await getQuestRecommendation();
      setQuest(newQuest);
    } catch (error) {
      console.error('Error fetching quest:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuest();
  }, [hasDumpedToday]);

  const handleRefresh = () => {
    fetchQuest();
  };

  const handleComplete = async () => {
    if (!quest) return;
    
    setQuest(prev => prev ? { ...prev, completed: true } : null);
    await new Promise(resolve => setTimeout(resolve, 500));
    fetchQuest();
  };

  // Locked state
  if (!hasDumpedToday) {
    return (
      <button 
        onClick={onOpenDump}
        className="w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800/30 space-y-2 text-left transition-all hover:border-gray-700/50 group"
      >
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-gray-400">Daily Quest</h2>
          <span className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-500 border border-gray-700/50">
            Locked
          </span>
        </div>
        
        <p className="text-gray-500 text-sm leading-relaxed">
          Share your thoughts in a Daily Dump first so Loob can better understand where you're at and suggest a meaningful quest.
        </p>

        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors">
          <span className="text-sm">Start Daily Dump</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800 space-y-4 animate-pulse">
        <div className="h-7 bg-gray-800 rounded-lg w-1/3"></div>
        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  // Active quest state
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800 space-y-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Today's Quest
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            ×
          </button>
        </div>
        
        {quest && (
          <div className="space-y-4">
            <p className="text-gray-200 text-lg leading-relaxed">
              Based on your dump, I think you should focus on{' '}
              <span className="font-medium text-purple-400">
                {quest.text}
              </span>
            </p>
            
            {quest.reason && (
              <p className="text-sm text-gray-400">
                {quest.reason}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleComplete}
                disabled={quest.completed}
                className={`px-4 py-2 rounded-xl transition-all ${
                  quest.completed
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {quest.completed ? '✓ Completed' : 'Mark Complete'}
              </button>
              
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all border border-gray-700 hover:border-gray-600"
              >
                Try Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyQuest; 