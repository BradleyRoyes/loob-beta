"use client";
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Bubble from '../components/Bubble';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { useChat } from 'ai/react';

const Page = () => {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");

  // Assuming you manage conversationId elsewhere or in a context that's accessible here
  // For demonstration, let's just initialize it here, but you would retrieve this from a more appropriate place
  const [conversationId] = useState(() => uuidv4());

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
    e.preventDefault(); // Prevent form submission
    // Call a custom function or modify your handleSubmit to incorporate additional data like conversationId
    // For the scope of this snippet, we're keeping it simple and not including unsupported properties
    handleSubmit(e, { body: JSON.stringify({ messages, useRag, llm, similarityMetric, conversationId }) });
  };

  const handlePrompt = (promptText) => {
    append({ id: uuidv4(), content: promptText, role: 'user' });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Chatbot Header and other UI components */}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5'>
              {/* Send Button SVG */}
              <span className='hidden md:block font-semibold text-sm ml-2'>Send</span>
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
        <Configure isOpen={configureOpen} onClose={() => setConfigureOpen(false)} useRag={useRag} llm={llm} similarityMetric={similarityMetric} setConfiguration={setConfiguration} />
      </main>
    </>
  );
};

export default Page;
