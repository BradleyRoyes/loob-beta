import React, { useEffect, useState } from 'react';
import { useGlobalState } from './GlobalStateContext';
import { format } from 'date-fns';

interface DailyDumpArchiveProps {
  onClose: () => void;
}

interface DumpEntry {
  id: string;
  content: string;
  createdAt: string;
  pseudonym: string;
  analysis?: {
    mood: string | null;
    topics: string[];
    actionItems: string[];
    sentiment: string | null;
  };
  metadata?: {
    source: string;
    version: string;
    hasEmbedding: boolean;
  };
}

const DailyDumpArchive: React.FC<DailyDumpArchiveProps> = ({ onClose }) => {
  const { userId } = useGlobalState();
  const [dumps, setDumps] = useState<DumpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchDumps = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/daily-dumps?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch dumps');
        const data = await response.json();
        setDumps(data);
      } catch (error) {
        console.error('Error fetching dumps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDumps();
  }, [userId]);

  const groupDumpsByDate = (dumps: DumpEntry[]) => {
    return dumps.reduce((groups: Record<string, DumpEntry[]>, dump) => {
      const date = format(new Date(dump.createdAt), 'MMMM d, yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(dump);
      return groups;
    }, {});
  };

  const groupedDumps = groupDumpsByDate(dumps);
  const dates = Object.keys(groupedDumps).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Get keywords from content (simple implementation)
  const extractKeywords = (content: string): string[] => {
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return [...new Set(words)]
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Memory Archive
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex gap-2 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedDate === date
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {date}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-blue-400 animate-pulse">Loading your memories...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {(selectedDate ? [selectedDate] : dates).map(date => (
              <div key={date} className="space-y-4">
                {groupedDumps[date].map((dump, index) => (
                  <div
                    key={dump.id}
                    className="bg-gray-800/50 backdrop-blur rounded-lg p-6 space-y-3 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-400">
                        {format(new Date(dump.createdAt), 'h:mm a')}
                      </div>
                      {dump.analysis?.mood && (
                        <div className="text-sm px-3 py-1 rounded-full bg-gray-700 text-gray-300">
                          {dump.analysis.mood}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-gray-200 whitespace-pre-wrap">
                      {dump.content}
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {extractKeywords(dump.content).map((keyword, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-300"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyDumpArchive; 