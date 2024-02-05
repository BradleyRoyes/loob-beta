"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid';

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit, setInput } = useChat({
    sendExtraMessageFields: true, // Ensure this is true to send additional fields
  });
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [sessionId] = useState(uuidv4); // Generate session ID once per session
  const [transcribedText, setTranscribedText] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    // Structure the message to include the session ID and any other necessary data
    const messageWithSessionId = {
      content: input,
      role: 'user', // Assuming role needs to be explicitly set
      sessionId: sessionId, // Include the session ID with each message
    };

    // Use the append function with custom request options to include additional data
    append(messageWithSessionId, {
      options: {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useRag,
          llm,
          similarityMetric,
          // Include any other relevant information here
        }),
      },
    });

    setInput(''); // Reset input field after sending the message
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            {/* Header and Welcome Text */}
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} content={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {transcribedText && (
            <div className="transcribed-text">
              <p className="text-lg md:text-xl">{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button'>
              {/* SVG for send button */}
            </button>
          </form>
          <Footer />
        </section>
        <Configure isOpen={configureOpen} onClose={() => setConfigureOpen(false)} {...{ useRag, llm, similarityMetric, setConfiguration }} />
      </main>
    </>
  );
}
