"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid';

const sessionID = uuidv4(); // Generate a session ID once per page load

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription);
    appendMessage(transcription);
  };

  const appendMessage = (content) => {
    const newMessage = { id: uuidv4(), content, role: 'user', sessionID };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    appendMessage(input);
    setInput('');
  };

  // Assuming handleInputChange updates the `input` state
  const handleInputChange = (e) => setInput(e.target.value);

  const handlePrompt = (promptText) => {
    appendMessage(promptText);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        {/* Page structure */}
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          {/* Header and intro */}
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={message.id} content={message.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {messages.length === 0 && <PromptSuggestionRow onPromptClick={handlePrompt} />}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input
              onChange={handleInputChange}
              value={input}
              className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2'
              placeholder='Send a message...'
            />
            <button type="submit" className='chatbot-send-button flex items-center justify-center rounded-md px-2.5'>
              Send
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
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
