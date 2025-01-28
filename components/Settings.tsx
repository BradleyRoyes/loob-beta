// settings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useGlobalState } from "./GlobalStateContext";
import Dropdown from "./Dropdown";
import Toggle from "./Toggle";
import { SimilarityMetric } from "../app/hooks/useConfiguration";
import "./Settings.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  useRag: boolean;
  llm: string;
  similarityMetric: SimilarityMetric;
  setConfiguration: (
    useRag: boolean,
    llm: string,
    similarityMetric: SimilarityMetric,
    location: string
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
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRag(useRag);
      setSelectedLlm(llm);
      setLocation("");
    }
  }, [isOpen, useRag, llm]);

  const llmOptions = [
    { label: "GPT 3.5 Turbo", value: "gpt-3.5-turbo" },
    { label: "GPT 4", value: "gpt-4" },
  ];

  const handleSave = () => {
    setConfiguration(rag, selectedLlm, similarityMetric, location);
    onClose();
  };

  const renderLoobricateSection = () => {
    if (isAnonymous) {
      return (
        <div className="bg-gray-800 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Loobricate Access</h3>
          <p className="text-gray-300 mb-3">
            Sign in to access and contribute to private Loobricates.
          </p>
          <button
            className="base-button"
            onClick={() => {
              console.log("Navigate to sign in");
            }}
          >
            Sign In
          </button>
        </div>
      );
    }

    if (!userId) {
      return (
        <div className="bg-gray-800 p-4 rounded-md">
          <p className="text-gray-300">Loading user data...</p>
        </div>
      );
    }

    if (connectedLoobricates.length === 0) {
      return (
        <div className="bg-gray-800 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">No Loobricates Found</h3>
          <p className="text-gray-300">
            You aren't connected to any Loobricates yet. Join or create one to
            start contributing.
          </p>
        </div>
      );
    }

    return (
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
        <p className="mt-1 text-sm text-gray-400">
          Select which Loobricate's vibe you want to influence through chat
        </p>
      </div>
    );
  };

  return (
    <div className={`modal-overlay ${isOpen ? "visible" : "hidden"}`}>
      <div className="modal-content">
        <div className="flex justify-between items-center pb-4">
          <h1 className="text-xl md:text-2xl font-medium">Settings</h1>
          <button
            onClick={onClose}
            className="text-4xl font-thin leading-8 hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {renderLoobricateSection()}

          <div className="flex flex-wrap gap-4">
            <Dropdown
              fieldId="llm"
              label="LLM"
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Update Location
            </label>
            <input
              type="text"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-600">
          <button className="base-button" onClick={onClose}>
            Cancel
          </button>
          <button className="base-button" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
