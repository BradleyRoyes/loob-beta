"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton'; // Import the ThemeButton component
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function

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
    setTranscribedText(transcription); // Use the state setter here
    append({ id: uuidv4(), content: transcription, role: 'user' });
  };

  const handleSend = (e) => {
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
  }

  const handlePrompt = (promptText) => {
    const msg = { id: uuidv4(), content: promptText, role: 'user' as const };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-center'> {/* Centered 'Loob Pig' */}
              <div className='flex items-center gap-2'>
                <svg width="24" height="25" viewBox="0 0 24 25">
                  {/* Remove the <path> element below */}
                </svg>
                <h1 className='chatbot-text-primary text-xl md:text-2xl font-medium'>Loob Pig</h1>
              </div>
            </div>
            <p className="chatbot-text-secondary-inverse text-sm md:text-base mt-2 md:mt-4">Simply type your questions or requests in a clear and concise manner. Responses are sourced from Astra documentation and a link for further reading is provided.</p>
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.map((message, index) => <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} />)}
            </div>
          </div>
          {!messages || messages.length === 0 && (
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          )}

          {/* Display transcribed text */}
          {transcribedText && (
            <div className="transcribed-text">
              <p>{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
              </svg>
              <span className='hidden origin:block font-semibold text-sm ml-2'>Send</span>
            </button>
            {<AudioRecorder onTranscription={handleTranscription} />}
          </form>
          <Footer />
        </section>
      </main>
      <Configure
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        useRag={useRag}
        llm={llm}
        similarityMetric={similarityMetric}
        setConfiguration={setConfiguration}
      />
      <ThemeButton /> {/* Add the ThemeButton component back */}
    </>
  )
}
