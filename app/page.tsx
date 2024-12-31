'use client';

import React, { useState, useRef, useEffect } from 'react';
import Bubble from '../components/Bubble';
import { useChat, Message } from 'ai/react';
import Configure from '../components/Configure';
import SplashScreen from '../components/SplashScreen';
import AnalyseButton from '../components/AnalyseButton';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ModalOverlay from '../components/ModalOverlay';
import AudioRecorder from '../components/AudioRecorder';
import Dashboard from '../components/Dashboard';

export default function Page() {
  const [view, setView] = useState<'Chat' | 'Dashboard'>('Chat'); // Manage views
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, {
      options: { body: { sessionId: 'some-session-id' } },
    });
    handleInputChange({
      target: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handlePrompt = (promptText: string) => {
    append({ id: crypto.randomUUID(), content: promptText, role: 'user' });
  };

  const handleEnter = (promptText?: string) => {
    setShowSplash(false);
    if (promptText) {
      handlePrompt(promptText);
    }
  };

  return showSplash ? (
    <SplashScreen onEnter={handleEnter} />
  ) : view === 'Dashboard' ? (
    <Dashboard />
  ) : (
    <main className="fade-in flex h-screen flex-col items-center justify-center pt-0">
      {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

      <section
        ref={messagesEndRef}
        className="chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6"
      >
        <div className="chatbot-header pb-6">
          <div className="flex justify-between items-center">
            <h1 className="chatbot-text-primary text-6xl md:text-7xl font-extrabold tracking-wide">
              <span className="text-5xl md:text-7xl">loob</span>
              <span className="text-lg md:text-xl font-normal">beta</span>
            </h1>
            <div className="flex gap-1">
              <button
                onClick={() => setConfigureOpen(true)}
                className="button-dash px-4 py-2 rounded-md"
              >
                Configure
              </button>
              <button
                onClick={() => setView('Dashboard')}
                className="button-dash px-4 py-2 rounded-md"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 relative overflow-y-auto my-4 md:my-6">
          <div className="absolute w-full overflow-x-hidden">
            {messages.map((message, index) => (
              <Bubble
                ref={messagesEndRef}
                key={`message-${index}`}
                content={message}
              />
            ))}
          </div>
        </div>
        {!messages.length && (
          <PromptSuggestionRow onPromptClick={handlePrompt} />
        )}
        <div className="button-row">
          <AudioRecorder
            onRecordingComplete={() => console.log('Recording Complete')}
            startRecording={() => console.log('Recording started')}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <form className="flex flex-1 gap-2" onSubmit={handleSend}>
            <input
              onChange={handleInputChange}
              value={input}
              className="chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2"
              placeholder="Send a message..."
            />
            <button
              type="submit"
              className="chatbot-send-button flex rounded-md items-center justify-center px-2.5"
            >
              Send
            </button>
          </form>
          <button
            onClick={() => setShowModal(true)}
            className="button-dash rounded-md items-center justify-center px-2.5 py-2"
          >
            End Chat
          </button>
        </div>
      </section>
      {configureOpen && (
        <Configure
          isOpen={configureOpen}
          onClose={() => setConfigureOpen(false)}
          useRag={true}
          llm="gpt-3.5-turbo"
          similarityMetric="cosine"
          setConfiguration={(rag, llm, similarityMetric) =>
            console.log('Configuration Updated:', { rag, llm, similarityMetric })
          }
        />
      )}
    </main>
  );
}
