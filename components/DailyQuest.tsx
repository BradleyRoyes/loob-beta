"use client";

import React, { useState, useEffect } from 'react';
import { useGlobalState } from './GlobalStateContext';

interface DailyQuestProps {
  onClose: () => void;
}

const DailyQuest: React.FC<DailyQuestProps> = ({ onClose }) => {
  const { userId } = useGlobalState();
  const [quest, setQuest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuest = async () => {
      if (!userId) {
        setError('Please log in to receive your daily quest.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/daily-quest?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch quest');
        }

        setQuest(data.quest);
      } catch (error) {
        console.error('Error fetching quest:', error);
        setError('Failed to retrieve your quest. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl mx-4 p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-3xl font-semibold text-center mb-8 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
          Daily Quest
        </h2>

        {/* Content */}
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          {loading ? (
            <div className="text-gray-400 animate-pulse">
              Divining your quest...
            </div>
          ) : error ? (
            <div className="text-red-400">
              {error}
            </div>
          ) : quest ? (
            <p className="text-xl text-gray-200 leading-relaxed max-w-xl mx-auto">
              {quest}
            </p>
          ) : (
            <div className="text-gray-400">
              No quest available at this time.
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default DailyQuest; 