"use client";

import React, { useEffect, useRef, useState } from "react";
import Bubble from "./Bubble";
import { useChat } from "ai/react";
import PromptSuggestionRow from "./PromptSuggestions/PromptSuggestionsRow";
import AudioRecorder from "./AudioRecorder";
import TulpaManager, { Tulpa } from "./TulpaManager";
import "./ChatModal.css";
import { useGlobalState } from "./GlobalStateContext";

interface ChatModalProps {
  onConfigureOpen?: () => void;
  showModal?: () => void;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-4 bg-gray-100/5 backdrop-blur-sm rounded-lg mx-4 mb-2">
    <div className="flex space-x-2">
      <div className="w-2.5 h-2.5 bg-pink-300/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2.5 h-2.5 bg-pink-300/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2.5 h-2.5 bg-pink-300/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const getIntroMessage = (activeTulpa: Tulpa | null, isAnonymous: boolean) => {
  if (isAnonymous) {
    return "Hi there! I'm Loob. Ask me about planning an event—gear, venues, or talent.";
  }

  if (!activeTulpa) {
    return "Welcome back! Select a Toolpuss to get started, or ask me about planning an event.";
  }

  const introMessages = {
    'harm-reduction': "I'm your Harm Reduction Guide. I'm here to provide compassionate, evidence-based guidance for safer practices. How can I assist you today?",
    'citizen-science': "Ready to contribute to citizen science? I'll help you document and analyze experiences with structured frameworks while maintaining anonymity.",
    'loobrary-matcher': "Welcome to your Resource Matcher! I'll help you find the perfect gear, venues, and talent from your local Loobricates. What are you looking for?"
  };

  return introMessages[activeTulpa.id] || "Hi! How can I help you today?";
};

export default function ChatModal({ onConfigureOpen, showModal }: ChatModalProps) {
  const { activeLoobricate, userId, activeTulpa, setActiveTulpa, isAnonymous } = useGlobalState();
  const [showTulpaManager, setShowTulpaManager] = useState(false);
  
  const { append, messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    body: {
      userId: userId || undefined,
      connectedLoobricates: activeLoobricate ? [activeLoobricate.id] : [],
      systemPrompt: activeTulpa?.systemPrompt,
      contextPath: activeTulpa?.contextPath
    }
  });
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Update vibe entity when messages change and we have a selected loobricate
  useEffect(() => {
    if (!activeLoobricate || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // We only want to update on assistant responses
      updateVibeEntity(activeLoobricate.id, lastMessage.content);
    }
  }, [messages, activeLoobricate]);

  const updateVibeEntity = async (loobricate_id: string, message: string) => {
    try {
      const response = await fetch('/api/vibe_entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: loobricate_id,
          state: {
            message,
            timestamp: new Date().toISOString(),
            mood: 'neutral',
            sentiment: 0,
            intensity: 0.5
          }
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
    if (!input.trim()) return;
    
    handleSubmit(e);
    handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    setShowIntroMessage(false);
    setTimeout(scrollToBottom, 100);
  };

  const handlePrompt = async (text: string) => {
    setShowIntroMessage(false);
    await append({
      id: crypto.randomUUID(),
      content: text,
      role: "user"
    });
    setTimeout(scrollToBottom, 100);
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    
    // Create a proper filename with timestamp and extension based on mime type
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = audioBlob.type === 'audio/webm' ? 'webm' : 
                     audioBlob.type === 'audio/mp4' ? 'm4a' :
                     audioBlob.type === 'audio/wav' ? 'wav' :
                     audioBlob.type === 'audio/ogg' ? 'ogg' : 'webm';
                     
    const filename = `audio-${timestamp}.${extension}`;
    
    // Log the audio details for debugging
    console.log('Uploading audio:', {
      size: audioBlob.size,
      type: audioBlob.type,
      filename
    });

    // Ensure the blob has the correct type
    const processedBlob = new Blob([audioBlob], { type: audioBlob.type || 'audio/webm' });
    formData.append("audio", processedBlob, filename);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.details || 
          `Server responded with ${response.status}`
        );
      }

      const data = await response.json();
      
      if (!data.transcription) {
        throw new Error('No transcription received from server');
      }
      
      handlePrompt(data.transcription);
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      // Show error to user using append instead of setMessages
      append({
        role: "assistant",
        content: `Sorry, I couldn't process the audio. ${
          error.message.includes('413') ? 'The recording was too long.' :
          error.message.includes('format') ? 'The audio format is not supported.' :
          'Please try again.'
        }`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="chatbot-section flex flex-col w-full max-w-md md:max-w-3xl mx-auto h-full md:h-[90vh] rounded-lg shadow-lg p-2 overflow-hidden">
      {/* Chat Header with Tulpa Button */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowTulpaManager(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 group relative"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">
              {activeTulpa?.icon || '🤖'}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-sm text-gray-400">
                {isAnonymous ? 'Current Assistant' : 'Active Companion'}
              </span>
              <span className="text-base text-gray-200 font-medium">
                {isAnonymous 
                  ? (activeTulpa?.name || 'Loob Assistant')
                  : (activeTulpa?.name || 'Choose Your Companion')}
              </span>
            </div>
          </div>
          {!isAnonymous && (
            <span className="ml-3 text-pink-300/70 text-sm group-hover:text-pink-300 transition-colors duration-300">
              Change →
            </span>
          )}
        </button>
      </div>

      {/* Chat Messages Section */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-4 relative"
        onScroll={handleScroll}
      >
        <div className="w-full flex flex-col">
          {showIntroMessage && (
            <div ref={latestMessageRef}>
              <Bubble
                key="intro-message"
                content={{
                  role: "system",
                  content: getIntroMessage(activeTulpa, isAnonymous),
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
          {isLoading && (
            <div className="self-start" ref={latestMessageRef}>
              <TypingIndicator />
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
      <div className="flex justify-center mb-2 audio-recorder-wrapper">
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
          onCancel={() => {
            setIsRecording(false);
            setIsProcessing(false);
          }}
          className="audio-recorder-mobile"
        />
      </div>

      {/* TulpaManager Modal */}
      <TulpaManager
        isOpen={showTulpaManager}
        onClose={() => setShowTulpaManager(false)}
        onSelect={(tulpa) => {
          setActiveTulpa(tulpa);
          // Clear messages when switching Tulpas
          setMessages([]);
          setShowIntroMessage(true);
        }}
      />

      {/* Input, Send Button, and Loobricate Selector */}
      <div className="flex flex-col gap-2 mt-auto pb-2">
        <form className="flex w-full gap-2" onSubmit={handleSend}>
          <input
            onChange={handleInputChange}
            value={input}
            disabled={inputDisabled}
            className={`chatbot-input flex-1 text-base md:text-base outline-none bg-gray-100 rounded-md p-3 
              ${inputDisabled ? 'opacity-50 cursor-not-allowed' : ''} 
              no-zoom-fix`}
            placeholder={isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Send a message...'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || inputDisabled}
            className={`base-button primary whitespace-nowrap transition-all touch-target
              ${(!input.trim() || inputDisabled) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}