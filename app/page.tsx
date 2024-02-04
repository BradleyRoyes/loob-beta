"use client"; // Mark the parent component as a client component
// Remember to replace imports with the correct path in your project structure
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

const Page: React.FC = () => {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  // State to manage the configuration modal visibility
  const [configureOpen, setConfigureOpen] = useState<boolean>(false);
  // State to manage the text transcribed from audio
  const [transcribedText, setTranscribedText] = useState<string>("");
  // State to manage conversation ID
  const [conversationId, setConversationId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat whenever messages update
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Check for existing conversationId or create a new one
    let existingId = localStorage.getItem('conversationId');
    if (!existingId) {
      existingId = uuidv4();
      localStorage.setItem('conversationId', existingId);
    }
    setConversationId(existingId);

    scrollToBottom();
  }, [messages]);

  // Function to handle audio transcription
  const handleTranscription = (transcription: string): void => {
    setTranscribedText(transcription);
    append({ id: uuidv4(), content: transcription, role: 'user', conversationId });
  };

  // Function to handle sending messages
  const handleSend = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); // Prevent the default form submission
    handleSubmit(e, { options: { body: JSON.stringify({ useRag, llm, similarityMetric, conversationId }) } });
  };

  // Function to handle selecting a prompt
  const handlePrompt = (promptText: string): void => {
    append({ id: uuidv4(), content: promptText, role: 'user', conversationId });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            <div className='flex justify-between'>
              <div className='flex items-center gap-2'>
                {/* SVG and title omitted for brevity */}
                <h1 className='text-xl md:text-2xl font-medium'>Loob</h1>
              </div>
              <div className='flex gap-1'>
                <ThemeButton />
                <button onClick={() => setConfigureOpen(true)}>
                  {/* SVG for button omitted for brevity */}
                </button>
              </div>
            </div>
            <p className="text-sm md:text-base mt-2 md:mt-4">Chatting with the Astra chatbot is a breeze! Simply type your questions or requests in a clear and concise manner. Responses are sourced from Astra documentation and a link for further reading is provided.</p>
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            <div className='absolute w-full overflow-x-hidden'>
              {messages.map((message, index) => <Bubble key={`message-${index}`} content={message} />)}
              <div ref={messagesEndRef}></div>
            </div>
          </div>
          {!messages || messages.length === 0 ? <PromptSuggestionRow onPromptClick={handlePrompt} /> : null}
          {transcribedText && (
            <div className="transcribed-text">
              <p>{transcribedText}</p>
            </div>
          )}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input onChange={handleInputChange} value={input} className='flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' placeholder='Send a message...' />
            <button type="submit" className='flex rounded-md items-center justify-center px-2.5'>
              {/* SVG for send button omitted for brevity */}
              <span className='hidden md:block font-semibold text-sm ml-2'>Send</span>
            </button>
          </form>
          <AudioRecorder onTranscription={handleTranscription} />
          <Footer />
        </section>
        <Configure isOpen={configureOpen} onClose={() => setConfigureOpen(false)} useRag={useRag} llm={llm} similarityMetric={similarityMetric} setConfiguration={setConfiguration} />
      </main>
    </>
  );
};

export default Page;
