import React, { useState, useEffect } from 'react';
import { useGlobalState } from './GlobalStateContext';

interface Challenge {
  text: string;
  reason?: string;
  completed?: boolean;
}

const DailyChallenge: React.FC = () => {
  const { userId } = useGlobalState();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder function - replace with actual implementation
  const getChallengeRecommendation = async (): Promise<Challenge> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      text: "Send that email",
      reason: "Mentioned it 3 times this week"
    };
  };

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const newChallenge = await getChallengeRecommendation();
      setChallenge(newChallenge);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleRefresh = () => {
    fetchChallenge();
  };

  const handleComplete = async () => {
    if (!challenge) return;
    
    // Placeholder - implement your completion logic
    setChallenge(prev => prev ? { ...prev, completed: true } : null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch new challenge after completion
    fetchChallenge();
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Today's Focus
      </h2>
      
      {challenge && (
        <div className="space-y-4">
          <p className="text-gray-200 text-lg">
            If I were you, I&apos;d focus on{' '}
            <span className="font-medium text-purple-400">
              {challenge.text}
            </span>{' '}
            today.
          </p>
          
          {challenge.reason && (
            <p className="text-sm text-gray-400">
              {challenge.reason}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleComplete}
              disabled={challenge.completed}
              className={`px-4 py-2 rounded-lg transition-colors ${
                challenge.completed
                  ? 'bg-green-600/50 text-green-200 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {challenge.completed ? 'Completed!' : 'Mark Complete'}
            </button>
            
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Try Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyChallenge; 