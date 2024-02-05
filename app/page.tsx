// Use client marker remains the same
"use client";
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import { useChat } from 'ai/react';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import NeuronVisual from '../components/NeuronVisual'; // Import the NeuronVisual component
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [showVisual, setShowVisual] = useState(false); // State to toggle visualization

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
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
  }

  const handlePrompt = (promptText) => {
    const msg = { id: uuidv4(), content: promptText, role: 'user' as const };
    append(msg);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        {showVisual ? (
          <section className='visual-section flex flex-col w-full h-full'>
            <NeuronVisual />
            <button onClick={() => setShowVisual(false)} className='absolute top-0 right-0 m-4'>
              X
            </button>
          </section>
        ) : (
          <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
            {/* Remaining chatbot UI goes here */}
            <div className='chatbot-header pb-6'>
              {/* Chatbot header content unchanged */}
              <div className='flex justify-between items-center'>
                {/* Chatbot title and configuration button */}
                {/* Visualize button added next to the send button */}
                <button onClick={() => setShowVisual(true)} className='visualize-button'>
                  Visualize
                </button>
              </div>
              {/* Remaining elements of the chatbot header */}
            </div>
            {/* The rest of your chatbot UI, including the chat messages, input form, and footer */}
            {/* Configure component for settings */}
            <Configure
              isOpen={configureOpen}
              onClose={() => setConfigureOpen(false)}
              useRag={useRag}
              llm={llm}
              similarityMetric={similarityMetric}
              setConfiguration={setConfiguration}
            />
          </section>
        )}
      </main>
    </>
  );
}
