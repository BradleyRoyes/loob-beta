"use client";

import React, { useEffect, useRef, useState } from 'react';
import Bubble from './Bubble';
import { useChat } from 'ai/react';
import PromptSuggestionRow from './PromptSuggestions/PromptSuggestionsRow';
import AudioRecorder from './AudioRecorder';
import Carousel from './Carousel'; // Assuming you have or will create a Carousel component

export default function ChatModal({ onConfigureOpen, showModal }) {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesEndRef = useRef(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    handleSubmit(e);
    handleInputChange({ target: { value: '' } });
    setShowIntroMessage(false); // Hide the intro message when the user sends a message
  };

  const handlePrompt = (text) => {
    append({ id: crypto.randomUUID(), content: text, role: 'user' });
    setShowIntroMessage(false); // Hide the intro message when the user uses a prompt
  };

  const handleAudioUpload = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription:', data.transcription);

      // Append the transcription to the chat
      handlePrompt(data.transcription);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  return (
    <section
      ref={messagesEndRef}
      className="chatbot-section flex flex-col w-full md:w-[600px] mx-auto bg-white rounded-lg shadow-lg p-4 max-h-[85vh] overflow-y-auto"
    >
      {/* Carousel Overlay */}
      <div className="overlay-carousel flex items-center justify-center mb-4 rounded-lg p-4 bg-gradient-to-r from-orange-300 to-pink-300">
        <Carousel>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Welcome to Loob!</h2>
            <p className="text-white">Plan events, book rentals, find venues, and more!</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Need Equipment?</h2>
            <p className="text-white">Ask about gear rentals and event supplies.</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Looking for Venues?</h2>
            <p className="text-white">Find the perfect space for your next event.</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Hire Talent!</h2>
            <p className="text-white">Discover performers, speakers, and event staff.</p>
          </div>
        </Carousel>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 relative overflow-y-auto mb-4">
        <div className="absolute w-full overflow-x-hidden">
          {showIntroMessage && (
            <Bubble
              key="intro-message"
              content={{
                role: 'system',
                content: "Hi there! I'm Loob. Ask me about planning your event—gear, venues, talent, and more!",
              }}
            />
          )}
          {messages.map((message, index) => (
            <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} />
          ))}
        </div>
      </div>

      {/* Prompt Suggestion Row (when no messages exist) */}
      {!messages.length && (
        <PromptSuggestionRow onPromptClick={handlePrompt} />
      )}

      {/* Audio Recorder Positioned Above Input Field */}
      <div className="audio-recorder-container mb-4 flex justify-center">
        <AudioRecorder
          onRecordingComplete={handleAudioUpload}
          startRecording={() => console.log('Recording started')}
        />
      </div>

      {/* Input and Buttons */}
      <div className="flex items-center gap-2 mt-4">
        <form className="flex flex-1 gap-2" onSubmit={handleSend}>
          <input
            onChange={handleInputChange}
            value={input}
            className="chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-3"
            placeholder="Send a message..."
          />
          <button type="submit" className="base-button primary">
            Send
          </button>
        </form>
        <button
          onClick={showModal}
          className="base-button secondary"
        >
          End Chat
        </button>
      </div>
    </section>
  );
}
