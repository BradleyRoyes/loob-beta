// Make sure this is a client component if you're using Next.js 13 or newer with app directory.
"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder'; // Correct path assumed as per your setup
import { randomUUID } from 'crypto';

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Adjusted to reflect state management in AudioRecorder

  // Scroll to the bottom of the chat whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle the transcription received from the AudioRecorder component
  const handleTranscription = (transcription) => {
    append({ id: randomUUID(), content: transcription, role: 'user' });
    setIsRecording(false); // Adjust recording state based on your logic
  };

  // Function to handle form submission
  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
    }
  };

  // Function to handle prompt selection
  const handlePrompt = (promptText) => {
    append({ id: randomUUID(), content: promptText, role: 'user' });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Chatbot UI components like header, messages display, etc. */}
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <PromptSuggestionRow onPromptClick={handlePrompt} />
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input
              onChange={handleInputChange}
              value={input}
              className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2'
              placeholder='Send a message...'
            />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              Send
            </button>
            <AudioRecorder onTranscription={handleTranscription} isRecording={isRecording} setIsRecording={setIsRecording} />
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
