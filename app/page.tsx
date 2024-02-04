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

  // Manage UUID for the conversation
  const [conversationId, setConversationId] = useState('');

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Check for existing UUID, generate if not found
    const existingId = localStorage.getItem('conversationId');
    if (!existingId) {
      const newId = uuidv4();
      localStorage.setItem('conversationId', newId);
      setConversationId(newId);
    } else {
      setConversationId(existingId);
    }

    scrollToBottom();
  }, [messages]);

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription); // Use the state setter here
    append({ id: uuidv4(), content: transcription, role: 'user', conversationId });
  };

  const handleSend = (e) => {
    e.preventDefault(); // Prevent actual form submission
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric, conversationId } } }); // Include conversationId in the submission
  }

  const handlePrompt = (promptText) => {
    const msg = { id: uuidv4(), content: promptText, role: 'user', conversationId };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6'>
          {/* Chatbot UI content */}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              {/* Send button content */}
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
        {/* Additional UI components */}
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
