import React, { useState } from 'react';
import { useGlobalState } from './GlobalStateContext';
import TulpaInfoModal from './TulpaInfoModal';
import './TulpaManager.css';

export interface Tulpa {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  contextPath?: string; // Path to custom context documents
  isCustom?: boolean;
  ownerId?: string;
  traits?: string[]; // New: personality traits
  level?: number;    // New: companion level
}

const defaultTulpas: Tulpa[] = [
  {
    id: 'harm-reduction',
    name: 'Harm Reduction Guide',
    description: 'Compassionate guidance for safer practices',
    systemPrompt: 'You are a compassionate and knowledgeable harm reduction assistant. Your role is to provide safe, nonjudgmental guidance on substance use, set and setting, integration practices, and risk mitigation. Use evidence-based strategies while maintaining a warm and approachable tone.',
    icon: '🌱',
    contextPath: '/contexts/harm-reduction',
    traits: ['Compassionate', 'Knowledgeable', 'Non-judgmental'],
    level: 1
  },
  {
    id: 'citizen-science',
    name: 'Citizen Science Collector',
    description: 'Document and analyze experiences',
    systemPrompt: 'You are an intelligent research assistant helping users document and analyze psychedelic experiences for citizen science projects. You guide structured data collection, offer survey frameworks, and synthesize findings into meaningful insights while maintaining participant anonymity.',
    icon: '🔬',
    contextPath: '/contexts/citizen-science',
    traits: ['Analytical', 'Methodical', 'Detail-oriented'],
    level: 1
  },
  {
    id: 'loobrary-matcher',
    name: 'Loobrary Resource Matcher',
    description: 'Connect with local resources',
    systemPrompt: 'You are a dedicated resource matcher expert in the Loobrary ecosystem. Your role is to connect users with the best resources available in their local loobricates. Each loobricate offers gear, talent, and venues. You ask insightful questions to understand the user\'s needs, preferences, and context. Then, you analyze the available options and recommend the most suitable loobricate, piece of gear, or talent that aligns with their requirements.',
    icon: '🔍',
    contextPath: '/contexts/loobrary-matcher',
    traits: ['Helpful', 'Connected', 'Resourceful'],
    level: 1
  }
];

interface TulpaManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tulpa: Tulpa) => void;
}

export default function TulpaManager({ isOpen, onClose, onSelect }: TulpaManagerProps) {
  const { userId, isAnonymous } = useGlobalState();
  const [activeTulpa, setActiveTulpa] = useState<Tulpa | null>(null);
  const [customTulpas, setCustomTulpas] = useState<Tulpa[]>([]);
  const [selectedTulpa, setSelectedTulpa] = useState<Tulpa | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Load custom Tulpas for logged-in users
  React.useEffect(() => {
    if (!isAnonymous && userId) {
      // TODO: Fetch custom Tulpas from API
      // For now, we'll just use the default ones
    }
  }, [userId, isAnonymous]);

  if (!isOpen) return null;

  const handleTulpaSelect = (tulpa: Tulpa) => {
    if (isAnonymous && tulpa.id !== 'loobrary-matcher') {
      // Show login prompt for non-default Tulpas
      alert('Please log in to access specialized Toolpusses');
      return;
    }
    setSelectedTulpa(tulpa);
  };

  const handleConfirmSelection = () => {
    if (selectedTulpa) {
      setActiveTulpa(selectedTulpa);
      onSelect(selectedTulpa);
      onClose();
    }
  };

  const availableTulpas = isAnonymous 
    ? [defaultTulpas.find(t => t.id === 'loobrary-matcher')!]
    : [...defaultTulpas, ...customTulpas];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[72px]">
      <div className="bg-[#1a1b26] rounded-lg w-full max-w-4xl max-h-[calc(100vh-88px)] overflow-hidden flex flex-col mx-2 md:mx-4">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[#2a2b36]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              {isAnonymous ? 'Available Assistant' : 'Choose Your Companion'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-gray-400">
              {isAnonymous 
                ? 'Log in to unlock more companions'
                : 'Each companion has unique traits and specialties'}
            </p>
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2b36] hover:bg-[#32333e] rounded-lg text-gray-300 transition-all duration-300 hover:text-[#ff9494] text-sm whitespace-nowrap"
            >
              <span>ℹ️</span>
              Tulpa Guide
            </button>
          </div>
        </div>

        {/* Tulpa Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTulpas.map((tulpa) => (
              <button
                key={tulpa.id}
                onClick={() => handleTulpaSelect(tulpa)}
                className={`
                  flex flex-col items-center p-4 rounded-lg transition-all duration-300
                  ${selectedTulpa?.id === tulpa.id 
                    ? 'bg-[#ff9494]/20 border-2 border-[#ff9494]' 
                    : 'bg-[#2a2b36] border-2 border-transparent hover:border-[#ff9494]/50'}
                  relative overflow-hidden group
                `}
              >
                <div className="relative mb-3">
                  <span className="text-4xl md:text-5xl transform transition-transform duration-300 group-hover:scale-110 block">
                    {tulpa.icon}
                  </span>
                  <span className="absolute -top-1 -right-1 bg-[#ff9494]/20 text-[#ff9494] text-xs px-2 py-0.5 rounded-full">
                    Lvl {tulpa.level}
                  </span>
                </div>
                
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">{tulpa.name}</h3>
                <p className="text-sm text-gray-400 text-center mb-3 line-clamp-2">{tulpa.description}</p>
                
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {tulpa.traits?.map((trait, index) => (
                    <span 
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-full bg-[#32333e] text-gray-300"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                {tulpa.isCustom && (
                  <span className="mt-2 px-2 py-0.5 bg-[#ff9494]/20 text-[#ff9494] text-xs rounded-full">
                    Custom
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#2a2b36] p-4 md:p-6 space-y-4">
          {selectedTulpa && !isAnonymous && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-gray-300">
                <span className="text-base font-medium">{selectedTulpa.name}</span>
                <span className="mx-2 text-gray-600">•</span>
                <span className="text-gray-400">Level {selectedTulpa.level}</span>
              </div>
              <button
                onClick={handleConfirmSelection}
                className="w-full sm:w-auto px-4 py-2 bg-[#ff9494]/20 hover:bg-[#ff9494]/30 text-[#ff9494] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Make Active Companion
                <span className="text-lg">→</span>
              </button>
            </div>
          )}

          {!isAnonymous && (
            <button
              onClick={() => alert('Custom companion creation coming soon!')}
              className="w-full p-3 bg-[#2a2b36] hover:bg-[#32333e] rounded-lg text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>✨</span>
              Create Custom Companion
            </button>
          )}
        </div>

        <TulpaInfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      </div>
    </div>
  );
} 