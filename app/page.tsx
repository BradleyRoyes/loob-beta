'use client';

import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat, Message } from 'ai/react';
import Configure from '../components/Configure';
import ThemeButton from '../components/ThemeButton';
import { v4 as uuidv4 } from 'uuid';
import SplashScreen from '../components/SplashScreen';
import AnalyseButton from '../components/AnalyseButton';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ModalOverlay from '../components/ModalOverlay';
import AudioRecorder from '../components/AudioRecorder';
import { useRouter } from 'next/navigation'; // Import Next.js router

export default function Page() {
  const router = useRouter(); // Create router instance to navigate
  const [showSplash, setShowSplash] = useState(true);
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, {});
    handleInputChange({
      target: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleDashboardClick = () => {
    router.push('/dashboard'); // Navigate to dashboard page
  };

  return showSplash ? (
    <SplashScreen onEnter={() => setShowSplash(false)} />
  ) : (
    <>
      <main className="fade-in flex h-screen-adjusted flex-col items-center justify-center pt-0">
        {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

        <section
          ref={messagesEndRef}
          className="chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6"
        >
          {/* Chat Interface */}
          <div className="chatbot-header pb-6">
            <div className="flex justify-between items-center">
              <h1 className="chatbot-text-primary text-6xl md:text-7xl font-extrabold tracking-wide">
                <span className="text-5xl md:text-7xl">loob</span>
                <span className="text-lg md:text-xl font-normal">beta</span>
              </h1>
              <div className="flex gap-1">
                <ThemeButton />
                <button
                  onClick={() => setConfigureOpen(true)}
                  className="button-dash px-4 py-2 rounded-md"
                >
                  Configure
                </button>
                <button
                  onClick={handleDashboardClick}
                  className="button-dash px-4 py-2 rounded-md"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
          {/* Remaining chat UI... */}
        </section>

        {configureOpen && (
          <Configure
            isOpen={configureOpen}
            onClose={() => setConfigureOpen(false)}
            useRag={true}
            llm="gpt-3.5-turbo"
            similarityMetric="cosine"
            setConfiguration={(rag, llm, similarityMetric) => {
              console.log('Configuration Updated:', { rag, llm, similarityMetric });
            }}
          />
        )}
      </main>
    </>
  );
}
