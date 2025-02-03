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
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle audio recording completion
  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
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
      setError("Failed to process audio. Please try again or type your thoughts instead.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving the dump
  const handleSave = async () => {
    if (!dumpText.trim()) {
      setError("Please enter some text before saving.");
      return;
    }
    
    if (!userId) {
      setError("You must be logged in to save your thoughts.");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await fetch("/api/daily-dumps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: dumpText.trim(),
          timestamp: new Date().toISOString(),
          userId,
          pseudonym,
          metadata: {
            source: "daily_dump",
            version: "1.0",
            hasEmbedding: true
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save dump");
      }

      // Show success message and clear the form
      setSaveSuccess(true);
      setDumpText("");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error saving dump:", error);
      setError(error instanceof Error ? error.message : "Failed to save your thoughts. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (showArchive) {
    return <DailyDumpArchive onClose={() => setShowArchive(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Daily Dump</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchive(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-800 rounded-lg hover:from-pink-300 hover:via-purple-300 hover:to-blue-300 transition-all"
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

        {/* Status Messages */}
        {error && (
          <div className="text-center text-red-400 bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="text-center text-green-400 bg-green-900/20 p-3 rounded-lg flex flex-col gap-2">
            <div>Successfully saved your thoughts!</div>
            <div className="text-sm text-green-300">
              Feel free to record another thought or check your archive.
            </div>
          </div>
        )}

        {/* Audio Recording Section */}
        <div className="flex justify-center py-4">
          <AudioRecorder
            onRecordingComplete={handleAudioUpload}
            startRecording={() => {
              setIsRecording(true);
              setError(null);
            }}
            stopRecording={() => {
              setIsRecording(false);
              setIsProcessing(true);
            }}
          />
        </div>

        {/* Processing Message */}
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
            onChange={(e) => {
              setDumpText(e.target.value);
              setError(null);
              setSaveSuccess(false);
            }}
            className="w-full h-48 px-3 py-2 text-gray-200 bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Start typing or record your thoughts..."
            disabled={isProcessing}
          />
        </div>

        {/* Character Count */}
        <div className="text-right text-sm text-gray-400">
          {dumpText.length} characters
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving || isProcessing || !dumpText.trim()}
            className={`px-6 py-2 rounded-md transition-all ${
              isSaving || isProcessing || !dumpText.trim()
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-gray-800 hover:from-pink-300 hover:via-purple-300 hover:to-blue-300"
            }`}
          >
            {isSaving ? "Saving..." : "Save Dump"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyDump; 