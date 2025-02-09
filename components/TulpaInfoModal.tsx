import React from 'react';
import './TulpaInfoModal.css';

interface TulpaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TulpaInfoModal({ isOpen, onClose }: TulpaInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-[72px]">
      <div className="bg-[#1a1b26] rounded-lg w-full max-w-2xl max-h-[calc(100vh-88px)] overflow-hidden flex flex-col mx-2 md:mx-4">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[#2a2b36] flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-white">Understanding Your Tulpa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6">
            {/* What are Tulpas */}
            <section className="bg-[#2a2b36] rounded-lg p-4">
              <h3 className="text-lg text-[#ff9494] mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                What are Tulpas?
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                Tulpas are your AI companions in the Loob ecosystem. Each Tulpa has unique traits, specialties, and a distinct personality. They grow and evolve alongside you, becoming more attuned to your needs and preferences over time.
              </p>
            </section>

            {/* Leveling System */}
            <section className="bg-[#2a2b36] rounded-lg p-4">
              <h3 className="text-lg text-[#ff9494] mb-3 flex items-center gap-2">
                <span className="text-xl">⭐️</span>
                Leveling System
              </h3>
              <div className="space-y-4">
                <div className="bg-[#32333e] p-3 rounded-lg">
                  <h4 className="text-white text-sm font-medium mb-2">How Tulpas Level Up:</h4>
                  <ul className="text-gray-300 space-y-1.5 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Regular Interaction: Daily conversations and queries
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Quality Feedback: Rating helpful responses
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Task Completion: Successfully helping you achieve goals
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Knowledge Growth: Learning from your shared experiences
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#32333e] p-3 rounded-lg">
                    <h4 className="text-white text-sm font-medium mb-2">Level Benefits:</h4>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">1</span>
                        Basic assistance and knowledge
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">2</span>
                        Enhanced context understanding
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">3</span>
                        Personalized recommendations
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">4</span>
                        Advanced pattern recognition
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">5</span>
                        Deep specialization mastery
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#32333e] p-3 rounded-lg">
                    <h4 className="text-white text-sm font-medium mb-2">Experience Points:</h4>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">+10</span>
                        Helpful Response
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">+25</span>
                        Task Completion
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">+5</span>
                        Daily Interaction
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#ff9494]">+15</span>
                        Positive Feedback
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Training Tips */}
            <section className="bg-[#2a2b36] rounded-lg p-4">
              <h3 className="text-lg text-[#ff9494] mb-3 flex items-center gap-2">
                <span className="text-xl">📚</span>
                Training Your Tulpa
              </h3>
              <div className="space-y-3">
                <div className="bg-[#32333e] p-3 rounded-lg">
                  <h4 className="text-white text-sm font-medium mb-2">Best Practices:</h4>
                  <ul className="text-gray-300 space-y-1.5 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Be specific in your requests
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Provide context for new topics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Follow up on conversations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#ff9494]">•</span>
                      Share feedback regularly
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Custom Tulpas */}
            <section className="bg-[#2a2b36] rounded-lg p-4">
              <h3 className="text-lg text-[#ff9494] mb-3 flex items-center gap-2">
                <span className="text-xl">✨</span>
                Custom Tulpas
              </h3>
              <div className="bg-[#32333e] p-3 rounded-lg">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Premium users can create custom Tulpas tailored to specific needs. Custom Tulpas can be trained with specialized knowledge bases and configured with unique personality traits.
                </p>
                <div className="mt-3 text-sm text-[#ff9494]/70">
                  Coming soon: Advanced customization options and training templates
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 