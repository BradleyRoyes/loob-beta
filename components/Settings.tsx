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

  const llmOptions = [
    { label: 'GPT 3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'GPT 4', value: 'gpt-4' }
  ];

  const similarityMetricOptions = [
    { label: 'Cosine Similarity', value: 'cosine' },
    { label: 'Euclidean Distance', value: 'euclidean' },
    { label: 'Dot Product', value: 'dot_product' }
  ];

  const handleSave = () => {
    setConfiguration(rag, selectedLlm, selectedSimilarityMetric, location);
    onClose();
  };

  return (
    <div
      className="modal-wrapper fixed inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center"
      style={{ zIndex: 10000 }} // High z-index for layering
    >
      <div
        className="modal-content flex flex-col w-full max-w-lg h-full max-h-[90vh] p-6 rounded-lg shadow-lg overflow-auto bg-gray-900 text-white"
        style={{ zIndex: 10001 }} // Modal content higher than overlay
      >
        <div className="grow">
          {/* Modal Header */}
          <div className="pb-6 flex justify-between items-center">
            <h1 className="text-white text-xl md:text-2xl font-medium">Settings</h1>
            <button
              onClick={onClose}
              className="text-white text-4xl font-thin leading-8"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
          {/* LLM and RAG Configuration */}
          <div className="flex flex-wrap mb-4 gap-4">
            <Dropdown
              fieldId="llm"
              label="LLM"
              options={llmOptions}
              value={selectedLlm}
              onSelect={setSelectedLlm}
            />
            <Toggle enabled={rag} label="Enable vector content (RAG)" onChange={() => setRag(!rag)} />
          </div>
          <Dropdown
            fieldId="similarityMetric"
            label="Similarity Metric"
            options={similarityMetricOptions}
            value={selectedSimilarityMetric}
            onSelect={setSelectedSimilarityMetric}
          />
          {/* Location Update Section */}
          <div className="mt-6">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-300"
            >
              Update Location
            </label>
            <input
              type="text"
              id="location"
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        {/* Modal Footer */}
        <div className="self-end w-full mt-6">
          <div className="flex justify-end gap-4">
            <button
              className="flex rounded-md items-center justify-center px-4 py-2 bg-gray-700 text-white hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex rounded-md items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500"
              onClick={handleSave}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
