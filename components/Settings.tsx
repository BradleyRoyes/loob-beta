import { useState } from "react";
import Dropdown from "./Dropdown";
import Toggle from "./Toggle";
import Footer from "./Footer";
import { SimilarityMetric } from "../app/hooks/useConfiguration";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  useRag: boolean;
  llm: string;
  similarityMetric: SimilarityMetric;
  setConfiguration: (useRag: boolean, llm: string, similarityMetric: SimilarityMetric, location: string) => void;
}

const Settings = ({ isOpen, onClose, useRag, llm, similarityMetric, setConfiguration }: Props) => {
  const [rag, setRag] = useState(useRag);
  const [selectedLlm, setSelectedLlm] = useState(llm);
  const [selectedSimilarityMetric, setSelectedSimilarityMetric] = useState<SimilarityMetric>(similarityMetric);
  const [location, setLocation] = useState(""); // New state for location

  if (!isOpen) return null;

  const handleSave = () => {
    setConfiguration(rag, selectedLlm, selectedSimilarityMetric, location);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-modal">
      <div className="flex flex-col w-full max-w-modal h-full max-h-[90vh] p-6 rounded-lg shadow-lg overflow-auto bg-surface text-primary">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-6">
          <h1 className="text-xl md:text-2xl font-medium">Settings</h1>
          <button
            onClick={onClose}
            className="text-4xl font-thin leading-8"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="grow">
          {/* LLM and RAG Configuration */}
          <div className="flex flex-wrap mb-4 gap-4">
            <Dropdown
              fieldId="llm"
              label="LLM"
              options={[
                { label: "GPT 3.5 Turbo", value: "gpt-3.5-turbo" },
                { label: "GPT 4", value: "gpt-4" },
              ]}
              value={selectedLlm}
              onSelect={setSelectedLlm}
            />
            <Toggle
              enabled={rag}
              label="Enable vector content (RAG)"
              onChange={() => setRag(!rag)}
            />
          </div>

          <Dropdown
            fieldId="similarityMetric"
            label="Similarity Metric"
            options={[
              { label: "Cosine Similarity", value: "cosine" },
              { label: "Euclidean Distance", value: "euclidean" },
              { label: "Dot Product", value: "dot_product" },
            ]}
            value={selectedSimilarityMetric}
            onSelect={setSelectedSimilarityMetric}
          />

          {/* Location Update Section */}
          <div className="mt-6">
            <label htmlFor="location" className="block text-sm font-medium">
              Update Location
            </label>
            <input
              type="text"
              id="location"
              className="mt-1 block w-full p-2 rounded-md shadow-sm focus:outline-none focus:ring focus:border sm:text-sm"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
