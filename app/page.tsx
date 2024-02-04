"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function

// Assuming useChat and useConfiguration are custom hooks you've defined for state management and configuration.
export default function Page() {
  const [sessionID, setSessionID] = useState(() => uuidv4()); // Generate or retrieve a session UUID.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription); // Use the state setter here
    // Append transcription with a new UUID for the message but keep the session ID consistent.
    append({ id: uuidv4(), content: transcription, role: 'user', sessionID });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Use the existing session ID for this message.
    append({ id: uuidv4(), content: input, role: 'user', sessionID });
    setInput(''); // Clear input after sending.
  };

  // Simplified for demonstration; adjust according to your actual implementation.
  const append = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handlePromptClick = (promptText) => {
    // Append prompted text with the same session ID.
    append({ id: uuidv4(), content: promptText, role: 'user', sessionID });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Header and other UI components */}
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={message.id} content={message.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {messages.length === 0 && <PromptSuggestionRow onPromptClick={handlePromptClick} />}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input
              onChange={handleInputChange}
              value={input}
              className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2'
              placeholder='Send a message...'
            />
            <button type="submit" className='chatbot-send-button flex items-center justify-center rounded-md px-2.5'>
              Send
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
        <Configure
          isOpen={configureOpen}
          onClose={() => setConfigureOpen(false)}
          // Assuming these are part of your application's configuration; adjust as needed.
        />
      </main>
    </>
  );
}
