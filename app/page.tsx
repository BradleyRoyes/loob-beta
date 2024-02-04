"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function
import NeuronVisual from '../components/NeuronVisual'; // Ensure this path is correct

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");

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
    e.preventDefault();
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
  };

  const handlePrompt = (promptText) => {
    const msg = { id: uuidv4(), content: promptText, role: 'user' };
    append({ ...msg, role: 'user' }); // Set the role to 'user'
  };

  return (
    <div className="flex h-screen justify-center items-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <main className="flex flex-1 flex-col items-center justify-center bg-white">
        <section className='chatbot-section flex flex-col w-full max-w-4xl h-full rounded-md shadow-lg p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between items-center'>
              <h1 className='chatbot-text-primary text-5xl md:text-6xl font-bold tracking-wide'>Loob The App</h1>
              <div className='flex gap-1'>
                <ThemeButton />
                <button onClick={() => setConfigureOpen(true)} className="focus:outline-none">
                  {/* Large "X" button */}
                  <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="18" fill="currentColor">X</text>
                  </svg>
                </button>
              </div>
            </div>
            <p className="chatbot-text-secondary-inverse text-lg md:text-xl mt-2 md:mt-4 font-medium">Welcome to Loob Labratories. A Journey Journal like no other. We are glad you are here.</p>
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.map((message, index) => (
                <Bubble key={`message-${index}`} content={message.content} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {!messages || messages.length === 0 && (
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          )}
          {/* Display transcribed text */}
          {transcribedText && (
            <div className="transcribed-text">
              <p className="text-lg md:text-xl">{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              {/* Large "X" button */}
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="18" fill="currentColor">X</text>
              </svg>
              <span className='hidden origin:block font-semibold text-sm ml-2'>Send</span>
            </button>
          </form>
          <Footer />
        </section>
      </main>
      <div className="neuron-visual-container flex-1">
        <NeuronVisual />
      </div>
      <Configure
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        useRag={useRag}
        llm={llm}
        similarityMetric={similarityMetric}
        setConfiguration={setConfiguration}
      />
    </div>
  )
}
