"use client";

import React, { useState, useRef } from "react";
import AudioRecorder from "./AudioRecorder";
import { useGlobalState } from './GlobalStateContext';
import DailyDumpArchive from './DailyDumpArchive';

interface DailyDumpProps {
  onClose: () => void;
}

const DailyDump: React.FC<DailyDumpProps> = ({ onClose }) => {
  const { userId, pseudonym } = useGlobalState();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dumpText, setDumpText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  // Handle audio recording completion
  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();
      setDumpText(prev => prev + " " + data.transcription);
    } catch (error) {
      console.error("Error uploading audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving the dump
  const handleSave = async () => {
    if (!dumpText.trim() || !userId) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/daily-dumps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: dumpText,
          timestamp: new Date().toISOString(),
          userId,
          pseudonym
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save dump");
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving dump:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Daily Dump</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchive(true)}
              className="px-4 py-2 daily-challenge-button"
            >
              View Archive
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Audio Recording Section */}
        <div className="flex justify-center py-4">
          <AudioRecorder
            onRecordingComplete={handleAudioUpload}
            startRecording={() => {
              setIsRecording(true);
            }}
            stopRecording={() => {
              setIsRecording(false);
              setIsProcessing(true);
            }}
          />
        </div>

        {/* Status Messages */}
        {isProcessing && (
          <div className="text-center text-blue-400">
            Processing your audio...
          </div>
        )}

        {/* Text Area */}
        <div className="space-y-2">
          <label htmlFor="dumpText" className="block text-sm text-gray-300">
            Your Thoughts
          </label>
          <textarea
            id="dumpText"
            value={dumpText}
            onChange={(e) => setDumpText(e.target.value)}
            className="w-full h-48 px-3 py-2 text-gray-200 bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Start typing or record your thoughts..."
            disabled={isProcessing}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving || isProcessing || !dumpText.trim()}
            className={`px-6 py-2 rounded-md transition-all ${
              isSaving || isProcessing || !dumpText.trim()
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Dump"}
          </button>
        </div>

        {showArchive && (
          <DailyDumpArchive onClose={() => setShowArchive(false)} />
        )}
      </div>
    </div>
  );
};

export default DailyDump; 