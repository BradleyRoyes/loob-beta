"use client"; // Mark the parent component as a client component
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

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  // Introduce conversationId state but handle it separately from the messages
  const [conversationId, setConversationId] = useState(() => localStorage.getItem('conversationId') || uuidv4());

  useEffect(() => {
    localStorage.setItem('conversationId', conversationId); // Persist conversationId in local storage
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription);
    append({ id: uuidv4(), content: transcription, role: 'user' });
  };

  const handleSend = (e) => {
    e.preventDefault(); // Prevent form submission
    // Adjusted to handle conversationId separately, if needed for your backend, include it here
    handleSubmit(e, { useRag, llm, similarityMetric, conversationId }); // Adjust how you include conversationId according to your backend needs
  };

  const handlePrompt = (promptText) => {
    append({ id: uuidv4(), content: promptText, role: 'user' });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Chat UI components remain unchanged */}
          <div className='chatbot-header pb-6'>
            {/* Header content */}
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.map((message, index) => (
                <Bubble key={index} content={message.content} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {transcribedText && (
            <div className="transcribed-text">
              <p>{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5'>
              {/* Send button SVG omitted for brevity */}
            </button>
          </form>
          <AudioRecorder onTranscription={handleTranscription} />
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
