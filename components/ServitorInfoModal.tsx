import React from 'react';
import './ServitorInfoModal.css';

interface ServitorInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServitorInfoModal({ isOpen, onClose }: ServitorInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[72px]">
      <div className="bg-[#1a1b26] rounded-lg w-full max-w-4xl max-h-[calc(100vh-88px)] overflow-hidden flex flex-col mx-2 md:mx-4">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[#2a2b36]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white">Understanding Your Servitor</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-8">
            {/* What are Servitors */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className="text-lg font-medium text-white">
                  What are Servitors?
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Servitors are your AI companions in the Loob ecosystem. Each Servitor has unique traits, specialties, and a distinct personality. They grow and evolve alongside you, becoming more attuned to your needs and preferences over time.
              </p>
            </div>

            {/* Leveling System */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⭐️</span>
                <h3 className="text-lg font-medium text-white">
                  Leveling System
                </h3>
              </div>
              <h4 className="text-white text-sm font-medium mb-2">How Servitors Level Up:</h4>
              <ul className="list-disc list-inside text-gray-400 space-y-2">
                <li>Meaningful conversations and interactions</li>
                <li>Successful task completions</li>
                <li>Positive user feedback</li>
                <li>Regular usage and engagement</li>
              </ul>
              <div className="mt-4 p-3 bg-[#2a2b36] rounded-lg">
                <p className="text-sm text-gray-300">
                  Higher levels unlock enhanced capabilities, deeper understanding, and more nuanced interactions.
                </p>
              </div>
            </div>

            {/* Training */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📚</span>
                <h3 className="text-lg font-medium text-white">
                  Training Your Servitor
                </h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-400 leading-relaxed">
                  Your interactions help shape and refine your Servitor's understanding and responses. Regular engagement in specific domains enhances their expertise in those areas.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#2a2b36] rounded-lg">
                    <h5 className="text-white font-medium mb-2">Active Training</h5>
                    <ul className="text-sm text-gray-400 space-y-1.5">
                      <li>• Direct feedback and corrections</li>
                      <li>• Specific task assignments</li>
                      <li>• Knowledge sharing sessions</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-[#2a2b36] rounded-lg">
                    <h5 className="text-white font-medium mb-2">Passive Learning</h5>
                    <ul className="text-sm text-gray-400 space-y-1.5">
                      <li>• Conversation patterns</li>
                      <li>• User preferences</li>
                      <li>• Interaction history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Servitors */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">✨</span>
                <h3 className="text-lg font-medium text-white">
                  Custom Servitors
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Premium users can create custom Servitors tailored to specific needs. Custom Servitors can be trained with specialized knowledge bases and configured with unique personality traits.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#2a2b36] p-4 md:p-6">
          <button
            onClick={onClose}
            className="w-full p-3 bg-[#2a2b36] hover:bg-[#32333e] rounded-lg text-gray-300 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
} 