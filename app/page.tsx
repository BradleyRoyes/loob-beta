"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble'; // Ensure this is the correct import path
import Footer from '../components/Footer'; // Ensure this is the correct import path
import Configure from '../components/Configure'; // Ensure this is the correct import path
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow'; // Adjust as needed
import ThemeButton from '../components/ThemeButton'; // Ensure this is the correct import path
import useConfiguration from './hooks/useConfiguration'; // Adjust based on actual import paths
import AudioRecorder from '../components/mediarecorder'; // Adjust this path to your actual AudioRecorder component path
import { randomUUID } from 'crypto';

export default function Page() {
  const { append, messages, input, setInput, handleSubmit } = useChat(); // Assuming useChat hook provides setInput for direct state management
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTranscription = (transcription) => {
    setInput(transcription); // Directly set the input with the transcription text
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return; // Guard clause for empty input

    // Assuming append function constructs the message object internally
    append({ id: randomUUID(), content: input, role: 'user' });
    setInput(''); // Clear input field after sending
  };

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
          <PromptSuggestionRow onPromptClick={handlePrompt} />
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input 
              onChange={(e) => setInput(e.target.value)} 
              value={input} 
              className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' 
              placeholder='Type your message here...'
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
          useRag={useRag} 
          llm={llm} 
          similarityMetric={similarityMetric} 
          setConfiguration={setConfiguration} 
        />
      </main>
    </>
  );
}
