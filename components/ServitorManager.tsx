import React, { useState } from 'react';
import { useGlobalState } from './GlobalStateContext';
import ServitorInfoModal from './ServitorInfoModal';
import './ServitorManager.css';

export interface Servitor {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  contextPath?: string;
  traits?: string[];
  level?: number;
}

const defaultServitors: Servitor[] = [
  {
    id: 'logis',
    name: 'Logis',
    description: 'The Architect\'s Companion - Master of event logistics and resource tracking',
    systemPrompt: 'You are Logis, the Architect\'s Companion, an expert in event logistics, resource tracking, and planning. Help users find venues, manage gear, schedule events, create budgets, and optimize event flow. Focus on practical solutions while maintaining a supportive and organized approach. Guide users in creating immersive experiences with strong logistical frameworks.',
    icon: '🏗️',
    contextPath: '/contexts/logis',
    traits: ['Organized', 'Efficient', 'Strategic'],
    level: 1
  },
  {
    id: 'harmoni',
    name: 'Harmoni',
    description: 'The Explorer\'s Companion - Guide for vibe curation and conscious exploration',
    systemPrompt: 'You are Harmoni, the Explorer\'s Companion, specializing in vibe curation, harm reduction, and integration practices. Help users match venues and vibes to their intentions, provide harm reduction guidance, and assist with reflection and integration. Maintain a compassionate, safety-focused approach while supporting deep consciousness exploration.',
    icon: '🌟',
    contextPath: '/contexts/harmoni',
    traits: ['Intuitive', 'Mindful', 'Supportive'],
    level: 1
  },
  {
    id: 'nexus',
    name: 'Nexus',
    description: 'The Alchemist\'s Companion - Catalyst for resource-sharing and connections',
    systemPrompt: 'You are Nexus, the Alchemist\'s Companion, focused on resource-sharing, network building, and community connections. Track and facilitate resource distribution, suggest collaborations, and help map decentralized systems. Guide users in expanding the Loob ecosystem while fostering meaningful connections and collaborative opportunities.',
    icon: '🔮',
    contextPath: '/contexts/nexus',
    traits: ['Connected', 'Collaborative', 'Visionary'],
    level: 1
  }
];

interface ServitorManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (servitor: Servitor) => void;
}

export default function ServitorManager({ isOpen, onClose, onSelect }: ServitorManagerProps) {
  const { userId, isAnonymous } = useGlobalState();
  const [selectedServitor, setSelectedServitor] = useState<Servitor | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  if (!isOpen) return null;

  const handleServitorSelect = (servitor: Servitor) => {
    setSelectedServitor(servitor);
  };

  const handleConfirmSelection = () => {
    if (selectedServitor) {
      onSelect(selectedServitor);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[72px] px-4 sm:px-6">
      <div className="bg-[#1a1b26] rounded-lg w-full max-w-4xl max-h-[calc(100vh-88px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[#2a2b36]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              Choose Your Companion
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
              Each companion has unique traits and specialties
            </p>
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2b36] hover:bg-[#32333e] rounded-lg text-gray-300 transition-all duration-300 hover:text-[#ff9494] text-sm whitespace-nowrap"
            >
              <span>ℹ️</span>
              Servitor Guide
            </button>
          </div>
        </div>

        {/* Servitor Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultServitors.map((servitor) => (
              <button
                key={servitor.id}
                onClick={() => handleServitorSelect(servitor)}
                className={`
                  flex flex-col items-center p-4 rounded-lg transition-all duration-300 h-full
                  ${selectedServitor?.id === servitor.id 
                    ? 'bg-[#ff9494]/20 border-2 border-[#ff9494]' 
                    : 'bg-[#2a2b36] border-2 border-transparent hover:border-[#ff9494]/50'}
                  relative overflow-hidden group
                `}
              >
                <div className="relative mb-3">
                  <span className="text-4xl md:text-5xl transform transition-transform duration-300 group-hover:scale-110 block">
                    {servitor.icon}
                  </span>
                  <span className="absolute -top-1 -right-1 bg-[#ff9494]/20 text-[#ff9494] text-xs px-2 py-0.5 rounded-full">
                    Lvl {servitor.level}
                  </span>
                </div>
                
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">{servitor.name}</h3>
                <p className="text-sm text-gray-400 text-center mb-3 line-clamp-2">{servitor.description}</p>
                
                <div className="flex flex-wrap gap-1.5 justify-center mt-auto">
                  {servitor.traits?.map((trait, index) => (
                    <span 
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-full bg-[#32333e] text-gray-300 whitespace-nowrap"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        {selectedServitor && (
          <div className="border-t border-[#2a2b36] p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-gray-300">
                <span className="text-base font-medium">{selectedServitor.name}</span>
                <span className="mx-2 text-gray-600">•</span>
                <span className="text-gray-400">Level {selectedServitor.level}</span>
              </div>
              <button
                onClick={handleConfirmSelection}
                className="w-full sm:w-auto px-4 py-2 bg-[#ff9494]/20 hover:bg-[#ff9494]/30 text-[#ff9494] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Make Active Companion
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        )}

        <ServitorInfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      </div>
    </div>
  );
} 