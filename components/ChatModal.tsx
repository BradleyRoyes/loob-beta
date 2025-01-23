"use client";

import React, { useEffect, useRef, useState } from "react";
import Bubble from "./Bubble";
import { useChat } from "ai/react";
import PromptSuggestionRow from "./PromptSuggestions/PromptSuggestionsRow";
import AudioRecorder from "./AudioRecorder";
import "./ChatModal.css";

interface ChatModalProps {
  onConfigureOpen?: () => void;
  showModal?: () => void;
}

export default function ChatModal({ onConfigureOpen, showModal }: ChatModalProps) {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

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

  const inputDisabled = isProcessing || isRecording;

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    setShowIntroMessage(false);
  };

  const handlePrompt = (text: string) => {
    append({ id: crypto.randomUUID(), content: text, role: "user" });
    setShowIntroMessage(false);
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
    <section className="chatbot-section flex flex-col w-full max-w-md md:max-w-3xl mx-auto h-full md:h-[90vh] rounded-lg shadow-lg p-4 overflow-hidden">
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
      <div className="flex-1 overflow-y-auto mb-4 scroll-smooth">
        <div className="w-full">
          {showIntroMessage && (
            <Bubble
              key="intro-message"
              content={{
                role: "system",
                content: "Hi there! I'm Loob. Ask me about planning your event—gear, venues, talent, and more!",
              }}
            />
          )}
          {messages.map((message, index) => (
            <Bubble key={`message-${index}`} content={message} />
          ))}
          {isProcessing && (
            <Bubble
              content={{
                role: "user",
                content: "Processing your voice message...",
              }}
            />
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
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
