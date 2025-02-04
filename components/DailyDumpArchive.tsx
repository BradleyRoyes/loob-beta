import React, { useEffect, useState } from 'react';
import { useGlobalState } from './GlobalStateContext';
import { format, parseISO } from 'date-fns';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDumps = async () => {
    if (!userId) {
      setError('No user ID found. Please log in.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dumps with no date restriction
      const response = await fetch(`/api/daily-dumps?userId=${userId}&limit=100`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dumps');
      }
      
      // Sort dumps by date, newest first
      const sortedDumps = data.sort((a: DumpEntry, b: DumpEntry) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setDumps(sortedDumps);
    } catch (error) {
      console.error('Error fetching dumps:', error);
      setError('Failed to load your memories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDumps();
  }, [userId]);

  const groupDumpsByDate = (dumps: DumpEntry[]) => {
    return dumps.reduce((groups: Record<string, DumpEntry[]>, dump) => {
      const date = format(parseISO(dump.createdAt), 'MMMM d, yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(dump);
      return groups;
    }, {});
  };

  const filteredDumps = dumps.filter(dump => 
    dump.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dump.analysis?.topics?.some(topic => 
      topic.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const groupedDumps = groupDumpsByDate(filteredDumps);
  const dates = Object.keys(groupedDumps).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const extractKeywords = (content: string): string[] => {
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'was', 'is', 'are']);
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

        {/* Search Bar */}
        <div className="px-6 pt-4">
          <input
            type="text"
            placeholder="Search your memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Date Navigation */}
        <div className="flex gap-2 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
          {dates.length > 0 && (
            <button
              onClick={() => setSelectedDate(null)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                !selectedDate
                  ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-800'
                  : 'bg-gray-800 text-gray-300 hover:bg-gradient-to-r hover:from-pink-200/30 hover:via-purple-200/30 hover:to-blue-200/30'
              }`}
            >
              All Dates
            </button>
          )}
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedDate === date
                  ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-800'
                  : 'bg-gray-800 text-gray-300 hover:bg-gradient-to-r hover:from-pink-200/30 hover:via-purple-200/30 hover:to-blue-200/30'
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
        ) : error ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="text-red-400">{error}</div>
            <button
              onClick={fetchDumps}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : dates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="text-gray-400">
              {searchTerm ? 'No memories found matching your search' : 'No memories found'}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-purple-400 hover:text-purple-300"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {(selectedDate ? [selectedDate] : dates).map(date => (
              <div key={date} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">{date}</h3>
                {groupedDumps[date].map((dump) => (
                  <div
                    key={dump.id}
                    className="bg-gray-800/50 backdrop-blur rounded-lg p-6 space-y-3 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-400">
                        {format(parseISO(dump.createdAt), 'h:mm a')}
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

                    {/* Topics */}
                    {dump.analysis?.topics && dump.analysis.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {dump.analysis.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-purple-900/50 text-purple-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

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