"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import Bubble from "./Bubble";
import { useChat } from "ai/react";
import PromptSuggestionRow from "./PromptSuggestions/PromptSuggestionsRow";
import AudioRecorder from "./AudioRecorder";
import Carousel from "./Carousel";
import "./ChatModal.css";


interface ChatModalProps {
  onConfigureOpen?: () => void;
  showModal?: () => void;
}

export default function ChatModal({ onConfigureOpen, showModal }: ChatModalProps) {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e); // Ensure `handleSubmit` expects the correct type
    handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    setShowIntroMessage(false);
  };
  

  const handlePrompt = (text: string) => {
    append({ id: crypto.randomUUID(), content: text, role: "user" });
    setShowIntroMessage(false);
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Transcription:", data.transcription);

      handlePrompt(data.transcription);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  return (
    <section
    ref={messagesEndRef}
    className="chatbot-section flex flex-col w-full max-w-md md:max-w-3xl mx-auto h-full md:h-[90vh] rounded-lg shadow-lg p-4 overflow-hidden"
  >  
      {/* Carousel Section */}
      <div className="overlay-carousel flex items-center justify-center mb-4 rounded-lg p-4 bg-gradient-to-r from-orange-300 to-pink-300">
        <Carousel>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Hi, I’m Loob.
          </h2>
            <p className="text-white">Plan events, book rentals, find new spaces.</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Need Equipment?</h2>
            <p className="text-white">Ask me about gear or event supplies.</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Looking for Space?</h2>
            <p className="text-white">Find a new spot for your next event.</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">To Get Started</h2>
            <p className="text-white">Simply talk to me or click some buttons.</p>
          </div>
        </Carousel>
      </div>

      {/* Chat Messages Section */}
      <div className="flex-1 relative overflow-y-auto mb-4">
        <div className="absolute w-full overflow-x-hidden">
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
            <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} />
          ))}
        </div>
      </div>

      {/* Prompt Suggestions */}
      {!messages.length && <PromptSuggestionRow onPromptClick={handlePrompt} />}

      {/* Audio Recorder Section */}
      <div className="audio-recorder-container mb-4 flex justify-center">
        <AudioRecorder
          onRecordingComplete={handleAudioUpload}
          startRecording={() => console.log("Recording started")}
        />
      </div>

      {/* Input and Control Buttons */}
      <div className="flex items-center gap-2 mt-4">
        <form className="flex flex-1 gap-2" onSubmit={handleSend}>
          <input
            onChange={handleInputChange}
            value={input}
            className="chatbot-input flex-1 text-sm md:text-base outline-none bg-gray-100 rounded-md p-3"
            placeholder="Send a message..."
          />
          <button type="submit" className="base-button primary">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
