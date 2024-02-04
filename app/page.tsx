"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid';

// Initialize a session UUID when the component is first loaded
const sessionUUID = uuidv4();

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [configureOpen, setConfigureOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTranscription = (transcription) => {
    // Here we just set the transcribed text without creating a new UUID for the message
    setInput(transcription);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Append the message with the session UUID
    const newMessage = { 
      id: uuidv4(), // Generate a new UUID for each message for uniqueness
      content: input, 
      role: 'user', 
      sessionUUID // Attach the session UUID to each message
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Assuming useConfiguration and useChat are custom hooks you've defined
  // These hooks need to properly handle the configurations and chat functionalities.
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Page structure and components unchanged */}
          <div className='chatbot-header pb-6'>
            {/* Header content unchanged */}
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={message.id} content={message.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {!messages.length && <PromptSuggestionRow />}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex items-center justify-center rounded-md px-2.5'>
              Send
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
        <Configure isOpen={configureOpen} onClose={() => setConfigureOpen(false)} {...{useRag, llm, similarityMetric, setConfiguration}} />
      </main>
    </>
  );
}
