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

export default function Page() {
  const [sessionID, setSessionID] = useState(() => localStorage.getItem('sessionID') || uuidv4());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [configureOpen, setConfigureOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sessionID', sessionID);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sessionID]);

  const { append, handleInputChange, handleSubmit } = useChat(); // Placeholder for actual implementation
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration(); // Placeholder for actual implementation

  const handleTranscription = (transcription) => {
    setTranscribedText(transcription);
    append({ id: uuidv4(), content: transcription, role: 'user', sessionID });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    append({ id: uuidv4(), content: input, role: 'user', sessionID });
    setInput('');
  };

  const handlePrompt = (promptText) => {
    append({ id: uuidv4(), content: promptText, role: 'user', sessionID });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between'>
              <div className='flex items-center gap-2'>
                {/* SVG and title */}
              </div>
              <div className='flex gap-1'>
                <ThemeButton />
                <button onClick={() => setConfigureOpen(true)}>
                  {/* Configure button SVG */}
                </button>
              </div>
            </div>
            <p className="chatbot-text-secondary-inverse text-sm md:text-base mt-2 md:mt-4">Chatting with the Astra chatbot is a breeze! Simply type your questions or requests in a clear and concise manner. Responses are sourced from Astra documentation and a link for further reading is provided.</p>
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.map((message, index) => <Bubble key={message.id} content={message.content} />)}
            </div>
          </div>
          {!messages.length && <PromptSuggestionRow onPromptClick={handlePrompt} />}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='chatbot-send-button flex items-center justify-center rounded-md px-2.5'>
              {/* Send button SVG */}
            </button>
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          <Footer />
        </section>
    </>
  );
}
      {/* Configuration modal */}
      <Configure
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        useRag={useRag}
        llm={llm}
        similarityMetric={similarityMetric}
        setConfiguration={setConfiguration}
      />
    </>
  );
}
