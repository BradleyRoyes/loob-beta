'use client';

import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import Configure from '../components/Configure';
import ThemeButton from '../components/ThemeButton';
import SplashScreen from '../components/SplashScreen';
import ModalOverlay from '../components/ModalOverlay';
import AudioRecorder from '../components/AudioRecorder';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// Define the Message type
type MessageType = {
  id: string;
  content: string;
  role: string;
};

export default function Page() {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<MessageType[]>([]); // Type messages as an array of MessageType
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessage: MessageType = {
        id: uuidv4(),
        content: input,
        role: 'user',
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput(''); // Clear input field
    }
  };

  const handleEnter = (promptText?: string) => {
    setShowSplash(false);
    if (promptText) {
      const newMessage: MessageType = {
        id: uuidv4(),
        content: promptText,
        role: 'user',
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  return showSplash ? (
    <SplashScreen onEnter={handleEnter} />
  ) : (
    <>
      <main className="fade-in flex h-screen-adjusted flex-col items-center justify-center pt-0">
        {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

        <section
          ref={messagesEndRef}
          className="chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6"
        >
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
          <div className="flex items-center justify-between gap-2">
            <form className="flex flex-1 gap-2" onSubmit={handleSend}>
              <input
                onChange={(e) => setInput(e.target.value)}
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
