"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder'; // Ensure this is the correct path to your AudioRecorder component
import { randomUUID } from 'crypto'; 

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState(""); // Define the state for holding transcribed text
  const [isRecording, setIsRecording] = useState(false); // State to manage recording UI feedback

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
    setIsRecording(false); // Stop recording UI feedback
  };

  // Handle form submission
  const handleSend = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (input.trim()) { // Only submit if input is not empty
      handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
    }
  }

  // Handle clicks on prompt suggestions
  const handlePrompt = (promptText) => {
    const msg = { id: randomUUID(), content: promptText, role: 'user' };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between'>
              {/* Your chatbot header here */}
            </div>
            {/* Chatbot introductory text or additional UI elements */}
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.map((message, index) => <Bubble ref={messagesEndRef} key={`message-${index}`} content={message} />)}
              {/* Ensure Bubble is the correct component for displaying messages */}
            </div>
          </div>
          {!messages || messages.length === 0 && (
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          )}
          {transcribedText && (
            <div className="transcribed-text">
              <p>{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              {/* Send button SVG or text here */}
            </button>
            <AudioRecorder onTranscription={handleTranscription} isRecording={isRecording} setIsRecording={setIsRecording} />
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
  );
}
