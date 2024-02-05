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
import NeuronVisual from '../components/NeuronVisual'; // Ensure this is correctly imported
import { v4 as uuidv4 } from 'uuid';

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [showVisual, setShowVisual] = useState(false); // State to manage visualization modal visibility

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription);
    append({ id: uuidv4(), content: transcription, role: 'user' });
  };

  const handleSend = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
  };

  const handlePrompt = (promptText) => {
    const msg = { id: uuidv4(), content: promptText, role: 'user' as const };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center px-4 md:px-20">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6 bg-white shadow-lg'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between items-center'>
              <h1 className='text-5xl md:text-6xl font-extrabold tracking-wide'>Loob The App</h1>
              <div className='flex gap-2 items-center'>
                <ThemeButton />
                {/* Icon button for visualization */}
                <button onClick={() => setShowVisual(true)} className='p-2 rounded-full hover:bg-gray-200 transition-colors duration-150'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.55-4.55a1 1 0 011.42 0l2.12 2.12a1 1 0 010 1.41L18.43 14m-5 5L5 19l-1-4 4-4m5 5v6m0 0l-3-3m3 3l3-3m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button onClick={() => setConfigureOpen(true)} className='p-2 rounded-full hover:bg-gray-200 transition-colors duration-150'>
                  {/* Settings icon, replace with actual SVG or component */}
                </button>
              </div>
            </div>
            <p className="text-lg md:text-xl mt-2 md:mt-4 font-medium">Welcome to Loob Laboratories. A Journey Journal like no other. We are glad you are here.</p>
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full h-full'>
              {messages.map((message, index) => <Bubble key={`message-${index}`} content={message} />)}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {!messages || messages.length === 0 ? (
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          ) : null}

          {transcribedText && (
            <div className="p-4">
              <p className="text-lg md:text-xl">{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2 border border-gray-300' placeholder='Send a message...' />
            <button type="submit" className='px-4 py-2 bg-blue-500 text-white rounded-md'>
              Send
            </button>
          </form>
          <Footer />
        </section>
        {showVisual && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg relative max-w-lg w-full">
              <NeuronVisual />
              <button onClick={() => setShowVisual(false)} className="absolute top-0 right-0 m-4 text-black">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
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
