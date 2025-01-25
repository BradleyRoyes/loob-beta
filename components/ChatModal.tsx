"use client";

import React, { useEffect, useRef, useState } from "react";
import Bubble from "./Bubble";
import { useChat } from "ai/react";
import PromptSuggestionRow from "./PromptSuggestions/PromptSuggestionsRow";
import AudioRecorder from "./AudioRecorder";
import "./ChatModal.css";

interface Loobricate {
  id: string;
  name: string;
  description: string;
  address: string;
  adminUsername: string;
  tags: string[];
  email?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ChatModalProps {
  onConfigureOpen?: () => void;
  showModal?: () => void;
}

export default function ChatModal({ onConfigureOpen, showModal }: ChatModalProps) {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loobricates, setLoobricates] = useState<Loobricate[]>([]);
  const [selectedLoobricate, setSelectedLoobricate] = useState<string | null>(null);

  // Fetch loobricates on component mount
  useEffect(() => {
    const fetchLoobricates = async () => {
      try {
        const response = await fetch('/api/loobricates');
        if (!response.ok) throw new Error('Failed to fetch loobricates');
        const data = await response.json();
        setLoobricates(data);
      } catch (error) {
        console.error('Error fetching loobricates:', error);
      }
    };
    fetchLoobricates();
  }, []);

  // Update vibe entity when messages change and we have a selected loobricate
  useEffect(() => {
    if (!selectedLoobricate || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // We only want to update on assistant responses
      updateVibeEntity(selectedLoobricate, lastMessage.content);
    }
  }, [messages, selectedLoobricate]);

  const updateVibeEntity = async (loobricate_id: string, message: string) => {
    try {
      const response = await fetch('/api/vibe_entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loobricate_id,
          message,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update vibe entity');
    } catch (error) {
      console.error('Error updating vibe entity:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      setShowScrollButton(false);
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (isProcessing) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (isProcessing) {
      document.body.style.cursor = 'wait';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isProcessing]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const inputDisabled = isProcessing || isRecording;

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    setShowIntroMessage(false);
    setTimeout(scrollToBottom, 100);
  };

  const handlePrompt = (text: string) => {
    append({ id: crypto.randomUUID(), content: text, role: "user" });
    setShowIntroMessage(false);
    setTimeout(scrollToBottom, 100);
  };

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
      handlePrompt(data.transcription);
    } catch (error) {
      console.error("Error uploading audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="chatbot-section flex flex-col w-full max-w-md md:max-w-3xl mx-auto h-full md:h-[90vh] rounded-lg shadow-lg p-2 overflow-hidden">
      {/* Loobricate Selector */}
      <div className="mb-0">
        <select
          className="loobricate-select w-3/4 p-0 rounded-md bg-[#333] text-white border-none"
          value={selectedLoobricate || ""}
          onChange={(e) => setSelectedLoobricate(e.target.value)}
        >
          <option value="" className="p-0">Select a Loobricate to influence...</option>
          {loobricates.map((loobricate) => (
            <option key={loobricate.id} value={loobricate.id} className="p-0">
              {loobricate.name}
            </option>
          ))}
        </select>
      </div>

      {/* Carousel temporarily commented out
      {!messages.length && (
        <div className="overlay-carousel flex items-center justify-center mb-4 rounded-lg p-4 bg-gradient-to-r from-orange-300 to-pink-300">
          <Carousel>
            ...
          </Carousel>
        </div>
      )}
      */}

      {/* Chat Messages Section */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-4 relative"
        onScroll={handleScroll}
      >
        <div className="w-full">
          {showIntroMessage && (
            <div ref={latestMessageRef}>
              <Bubble
                key="intro-message"
                content={{
                  role: "system",
                  content: "Hi there! I'm Loob. Ask me about planning your event—gear, venues, talent, and more!",
                }}
              />
            </div>
          )}
          {messages.map((message, index) => (
            <div 
              key={`message-${index}`}
              ref={index === messages.length - 1 ? latestMessageRef : undefined}
            >
              <Bubble content={message} />
            </div>
          ))}
          {isProcessing && (
            <div ref={latestMessageRef}>
              <Bubble
                content={{
                  role: "user",
                  content: "Processing your voice message...",
                }}
              />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 
              flex items-center justify-center"
            aria-label="Scroll to bottom"
          >
            <svg 
              className="w-5 h-5 text-gray-600 dark:text-gray-300" 
              fill="none" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Prompt Suggestions */}
      {!messages.length && <PromptSuggestionRow onPromptClick={handlePrompt} />}

      {/* Audio Recorder - Centered */}
      <div className="flex justify-center mb-2">
        <AudioRecorder
          onRecordingComplete={handleAudioUpload}
          startRecording={() => {
            setShowIntroMessage(false);
            setIsRecording(true);
            scrollToBottom();
          }}
          stopRecording={() => {
            setIsRecording(false);
            setIsProcessing(true);
          }}
        />
      </div>

      {/* Input and Send Button */}
      <div className="flex gap-2 mt-auto">
        <form className="flex w-full gap-2" onSubmit={handleSend}>
          <input
            onChange={handleInputChange}
            value={input}
            disabled={inputDisabled}
            className={`chatbot-input flex-1 text-sm md:text-base outline-none bg-gray-100 rounded-md p-3 
              ${inputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={inputDisabled ? 'Processing...' : 'Send a message...'}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || inputDisabled}
            className={`base-button primary whitespace-nowrap transition-all
              ${(!input.trim() || inputDisabled) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}