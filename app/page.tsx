'use client'; // Mark the parent component as a client component

import React, { useState, useRef, useEffect } from 'react';
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
import Dashboard from '../components/Dashboard';

export default function Page() {
  const [view, setView] = useState<'Chat' | 'Dashboard'>('Chat'); // Manage views
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const [sessionId] = useState(uuidv4());
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
      options: { body: { sessionId } },
    });
    handleInputChange({
      target: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handlePrompt = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: 'user',
    };
    append(msg);
  };

  const startRecording = () => {
    console.log('Recording started');
  };

  const onRecordingComplete = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio/webm');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription:', data.transcription);

      handlePrompt(data.transcription);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const handleEnter = (promptText?: string) => {
    setShowSplash(false);
    if (promptText) {
      handlePrompt(promptText);
    }
  };

  const handleAnalyseButtonClick = () => {
    const analyseMessage = 'analyse my messages';
    append({ content: analyseMessage, role: 'user' });
    setShowModal(true);

    setTimeout(() => {
      const endChatMessage = 'End Chat';
      append({ content: endChatMessage, role: 'user' });
    }, 5000);
  };

  return showSplash ? (
    <SplashScreen onEnter={handleEnter} />
  ) : view === 'Dashboard' ? (
    <Dashboard />
  ) : (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .fade-in {
            animation: fadeIn 1.5s ease-in-out;
          }

          .h-screen-adjusted {
            height: calc(var(--vh, 1vh) * 100);
          }
        `}
      </style>
      <main className="fade-in flex h-screen-adjusted flex-col items-center justify-center pt-0">
        {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

        <section
          ref={messagesEndRef}
          className="chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6"
        >
          <div className="chatbot-header pb-6">
            <div className="flex justify-between items-center">
              <h1 className="chatbot-text-primary text-6xl md:text-7xl font-extrabold tracking-wide">
                <span className="text-5xl md:text-7xl">loob</span>
                <span className="text-lg md:text-xl font-normal">
                  beta
                </span>
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
              onRecordingComplete={onRecordingComplete}
              startRecording={startRecording}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <form className="flex flex-1 gap-2" onSubmit={handleSend}>
              <input
                onChange={(e) => handleInputChange(e)}
                value={input}
                className="chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2"
                placeholder="Send a message..."
              />
              <button
                type="submit"
                className="chatbot-send-button flex rounded-md items-center justify-center px-2.5"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="hidden origin:block font-semibold text-sm ml-2">
                  Send
                </span>
              </button>
            </form>
            <button
              onClick={handleAnalyseButtonClick}
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
            setConfiguration={(rag, llm, similarityMetric) => {
              console.log('Configuration Updated:', { rag, llm, similarityMetric });
            }}
          />
        )}
      </main>
    </>
  );
}
