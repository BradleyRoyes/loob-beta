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
import NeuronVisual from '../components/NeuronVisual'; // Import NeuronVisual component
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [showVisual, setShowVisual] = useState(false); // State to toggle visualization modal

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
        <section className='chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6 bg-white shadow-lg'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between items-center'>
              <h1 className='chatbot-text-primary text-5xl md:text-6xl font-extrabold tracking-wide'>Loob The App</h1>
              <div className='flex gap-1 items-center'>
                <ThemeButton />
                <button onClick={() => setConfigureOpen(true)} className='btn-icon'>
                  {/* Settings icon here */}
                </button>
                <button
                  className="btn-icon"
                  onClick={() => setShowVisual(true)}
                >
                  Visualize
                </button>
              </div>
            </div>
            <p className="chatbot-text-secondary-inverse text-lg md:text-xl mt-2 md:mt-4 font-medium">Welcome to Loob Labratories. A Journey Journal like no other. We are glad you are here.</p>
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
            <div className="transcribed-text p-4">
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
            <div className="bg-white p-5 rounded-lg shadow-lg relative">
              <NeuronVisual />
              <button
                onClick={() => setShowVisual(false)}
                className="absolute top-0 right-0 m-4 text-black text-lg"
              >
                X
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
