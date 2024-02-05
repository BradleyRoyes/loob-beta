"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat, Message } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import { v4 as uuidv4 } from 'uuid'; // Ensure you've installed uuid

export default function Home() {
  const { append, messages, input, handleInputChange, setInput } = useChat({
    sendExtraMessageFields: true,
  });
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [sessionId] = useState(uuidv4()); // Generate a unique session ID for this chat session

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const messageData = {
      content: input,
      role: 'user', // Explicitly set the role
      sessionId: sessionId, // Attach the session ID
      useRag: useRag, // Include configuration settings if needed
      llm: llm,
      similarityMetric: similarityMetric,
    };

    // Append the new message
    append(messageData);
    setInput(''); // Clear the input field
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Header and Configuration Button */}
          <div className='chatbot-header pb-6'>
            {/* Existing Header Content */}
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => <Bubble key={`message-${index}`} content={message} />)}
            <div ref={messagesEndRef} />
          </div>
          {!messages.length && <PromptSuggestionRow onPromptClick={(promptText) => handlePrompt(promptText)} />}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input className='chatbot-input flex-1' onChange={handleInputChange} value={input} placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button'>Send</button>
          </form>
          <Footer />
        </section>
        <Configure isOpen={configureOpen} onClose={() => setConfigureOpen(false)} {...{useRag, llm, similarityMetric, setConfiguration}} />
      </main>
    </>
  );
}
