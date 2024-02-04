"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder'; // Ensure this is the correct path to your AudioRecorder component
import { randomUUID } from 'crypto'; 

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState(""); // Define the state for holding transcribed text

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle audio transcription result
  const handleTranscription = (transcription) => {
    setTranscribedText(transcription);
    append({ id: randomUUID(), content: transcription, role: 'user' });
  };

  // Handle form submission
  const handleSend = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (input.trim()) { // Only submit if input is not empty
      handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
    }
  };

  // Handle clicks on prompt suggestions
  const handlePrompt = (promptText) => {
    append({ id: randomUUID(), content: promptText, role: 'user' });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} content={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input
              onChange={handleInputChange}
              value={input}
              className='flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2'
              placeholder='Send a message...'
            />
            <button type="submit" className='flex items-center justify-center rounded-md px-2.5'>
              Send
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
        <Configure
          isOpen={configureOpen}
          onClose={() => setConfigureOpen(false)}
          useRag={useRag}
          llm={llm}
          similarityMetric={similarityMetric}
          setConfiguration={setConfiguration}
        />
      </>
  );
}
