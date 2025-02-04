// settings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useGlobalState } from "./GlobalStateContext";
import Dropdown from "./Dropdown";
import Toggle from "./Toggle";
import { SimilarityMetric } from "../app/hooks/useConfiguration";
import StickDashboard from "./StickDashboard";
import "./Settings.css";
import { FaCog, FaBuilding, FaTools } from 'react-icons/fa';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  useRag: boolean;
  llm: string;
  similarityMetric: SimilarityMetric;
  setConfiguration: (
    useRag: boolean,
    llm: string,
    similarityMetric: SimilarityMetric
  ) => void;
}

const Settings: React.FC<Props> = ({
  isOpen,
  onClose,
  useRag,
  llm,
  similarityMetric,
  setConfiguration,
}) => {
  const {
    connectedLoobricates = [],
    activeLoobricate,
    setActiveLoobricate,
    isAnonymous,
    userId,
  } = useGlobalState();

  const [rag, setRag] = useState(useRag);
  const [selectedLlm, setSelectedLlm] = useState(llm);
  const [showStickDashboard, setShowStickDashboard] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('general');
  const [showJoinInfo, setShowJoinInfo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRag(useRag);
      setSelectedLlm(llm);
    }
  }, [isOpen, useRag, llm]);

  // Auto-save effect
  useEffect(() => {
    if (isOpen) {
      setConfiguration(rag, selectedLlm, similarityMetric);
    }
  }, [rag, selectedLlm]); // Auto-save when these values change

  const llmOptions = [
    { id: 'gpt-3.5-turbo', label: "GPT 3.5 Turbo", value: "gpt-3.5-turbo" },
    { id: 'gpt-4', label: "GPT 4", value: "gpt-4" },
  ];

  const handleSave = () => {
    setConfiguration(rag, selectedLlm, similarityMetric);
    onClose();
  };

  const tools = [
    {
      id: 'stick-magic',
      title: 'Stick Magic',
      description: 'Access video frame extraction and other stick-related tools',
      onClick: () => setShowStickDashboard(true),
    },
    // Add more tool objects here
  ];

  const handleSignIn = () => {
    window.location.reload();
  };

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: <FaCog className="text-lg" />,
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Dropdown
              fieldId="llm"
              label="LLM Model"
              options={llmOptions}
              value={selectedLlm}
              onSelect={setSelectedLlm}
            />
            <Toggle
              enabled={rag}
              label="Enable vector content (RAG)"
              onChange={() => setRag(!rag)}
            />
          </div>
        </div>
      )
    },
    {
      id: 'loobricate',
      title: 'Loobricate Settings',
      icon: <FaBuilding className="text-lg" />,
      content: (
        <div className="space-y-4">
          {isAnonymous ? (
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Loobricate Access</h3>
              <p className="text-gray-300 mb-3">
                Sign in to access and contribute to private Loobricates.
              </p>
              <button className="base-button" onClick={handleSignIn}>Sign In</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Active Loobricate
                </label>
                <select
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm text-white"
                  value={activeLoobricate?.id || ""}
                  onChange={(e) => {
                    const selected = connectedLoobricates.find(
                      (l) => l.id === e.target.value
                    );
                    setActiveLoobricate(selected || null);
                  }}
                >
                  <option value="">Select a Loobricate</option>
                  {connectedLoobricates.map((loobricate) => (
                    <option key={loobricate.id} value={loobricate.id}>
                      {loobricate.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <button 
                  className="base-button w-full"
                  onClick={() => setShowJoinInfo(!showJoinInfo)}
                >
                  Join a Loobricate
                </button>
                {showJoinInfo && (
                  <div className="p-3 bg-gray-800 rounded-md text-sm text-gray-300">
                    At the moment, the only way to join a Loobricate is to have an admin add you. Find an admin to join a Loobricate :)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'tools',
      title: 'Tools',
      icon: <FaTools className="text-lg" />,
      content: (
        <div className="space-y-4">
          {tools.map(tool => (
            <div key={tool.id} className="tool-item" onClick={tool.onClick}>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                <div>
                  <h3 className="text-md font-medium">{tool.title}</h3>
                  <p className="text-sm text-gray-400">{tool.description}</p>
                </div>
                <span className="text-lg">→</span>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <>
      <div className={`modal-overlay ${isOpen ? "visible" : "hidden"}`}>
        <div className="modal-content p-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-center pb-4">
              <h1 className="text-xl font-medium">Settings</h1>
              <button
                onClick={onClose}
                className="text-3xl font-thin leading-8 hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col">
              {/* Settings Navigation */}
              <div className="border-b border-gray-700 pb-2">
                {settingsSections.map(section => (
                  <div
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer mb-2 ${
                      activeSection === section.id ? 'bg-gray-700' : 'hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    <span className="text-sm">{section.title}</span>
                  </div>
                ))}
              </div>

              {/* Settings Content */}
              <div className="overflow-y-auto">
                {settingsSections.find(s => s.id === activeSection)?.content}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-600">
              <button className="base-button" onClick={onClose}>
                Cancel
              </button>
              <button className="base-button" onClick={handleSave}>
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stick Dashboard Modal */}
        {showStickDashboard && (
          <StickDashboard onClose={() => setShowStickDashboard(false)} />
        )}
      </div>
    </>
  );
};

export default Settings;
