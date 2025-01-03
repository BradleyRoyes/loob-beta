'use client';

import React, { useState, useRef, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import Bubble from '../components/Bubble';
import { useChat, Message } from 'ai/react';
import Configure from '../components/Configure';
import SplashScreen from '../components/SplashScreen';
import AnalyseButton from '../components/AnalyseButton';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ModalOverlay from '../components/ModalOverlay';
import AudioRecorder from '../components/AudioRecorder';
import ToggleButton from '../components/ThemeButton'; // Importing the ToggleButton component

export default function Page() {
  const [view, setView] = useState<'Chat' | 'Dashboard'>('Chat');
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
    <Dashboard onShowChat={() => setView('Chat')} />
  ) : (
    <main className="fade-in flex h-screen flex-col items-center justify-center pt-0">
      {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

      <section
        ref={messagesEndRef}
        className="chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6"
      >
        {/* Chat Header */}
        <div className="chatbot-header pb-6">
          <div className="flex justify-between items-center">
            <h1 className="chatbot-text-primary text-6xl md:text-7xl font-extrabold tracking-wide">
              <span className="text-5xl md:text-7xl">Loob</span>
              <span className="text-lg md:text-xl font-normal">Beta</span>
            </h1>
            <div className="flex gap-1">
              <ToggleButton /> {/* Theme Toggle Button */}
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

        {/* Chat Messages */}
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
              Send
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
  );
}