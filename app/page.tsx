"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react'; // Import the useChat hook
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration, { generateSessionUUID } from './hooks/useConfiguration'; // Import generateSessionUUID
import AudioRecorder from '../components/mediarecorder';

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();
  const [sessionUUID] = useState(generateSessionUUID()); // Generate a session UUID

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
    // Append messages with the sessionUUID included
    append({ id: sessionUUID, content: transcription, role: 'user' });
  };

  const handleSend = (e) => {
    e.preventDefault(); // Prevent default form submission
    handleSubmit(e, {
      options: {
        body: {
          useRag,
          llm,
          similarityMetric,
          uuid: sessionUUID, // Include the session UUID
        },
      },
    });
  }

  const handlePrompt = (promptText) => {
    // Append messages with the sessionUUID included
    const msg = { id: sessionUUID, content: promptText, role: 'user' as const };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between items-center'>
              <h1 className='chatbot-text-primary text-5xl md:text-6xl font-extrabold tracking-wide'>Loob The App</h1>
              <div className='flex gap-1'>
                <ThemeButton />
                <button onClick={() => setConfigureOpen(true)}>Configure</button>
              </div>
            </div>
            <p className="chatbot-text-secondary-inverse text-lg md:text-xl mt-2 md:mt-4 font-medium">Welcome to Loob Labratories. A Journey Journal like no other. We are glad you are here.</p>
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
              <p className="text-lg md:text-xl">{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>Send</button>
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
    </>
  )
}
