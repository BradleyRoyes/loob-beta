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

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  // Initialize conversationId state
  const [conversationId, setConversationId] = useState(() => localStorage.getItem('conversationId') || uuidv4());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Save the conversationId to localStorage to persist across reloads
    localStorage.setItem('conversationId', conversationId);
  }, [messages, conversationId]);

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription); // Use the state setter here
    append({ id: uuidv4(), content: transcription, role: 'user', conversationId });
  };

  const handleSend = (e) => {
    e.preventDefault(); // Prevent default form submission
    // Include conversationId in the submission
    handleSubmit(e, { options: { body: JSON.stringify({ useRag, llm, similarityMetric, conversationId }) } });
  };

  const handlePrompt = (promptText) => {
    const msg = { id: uuidv4(), content: promptText, role: 'user', conversationId };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* The rest of your JSX remains unchanged */}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              {/* SVG and other elements as before */}
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
        <Configure isOpen={configureOpen} onClose={() => setConfigureOpen(false)} useRag={useRag} llm={llm} similarityMetric={similarityMetric} setConfiguration={setConfiguration} />
      </main>
    </>
  );
}
