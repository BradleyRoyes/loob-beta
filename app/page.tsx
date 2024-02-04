import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble';
import Footer from '../components/Footer';
import Configure from '../components/Configure';
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow';
import ThemeButton from '../components/ThemeButton';
import useConfiguration from './hooks/useConfiguration';
import AudioRecorder from '../components/mediarecorder';
import { v4 as uuidv4 } from 'uuid'; // Import the v4 function and rename it to uuidv4 for clarity

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [configureOpen, setConfigureOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Hooks from your setup (adjust according to your actual implementation)
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTranscription = (transcription) => {
    setInput(transcription);
  };

  const appendMessage = () => {
    if (!input.trim()) return; // Guard clause for empty input

    // Create a new message object with a unique id
    const newMessage = { id: uuidv4(), content: input, role: 'user' };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput(''); // Clear the input field after appending the message
  };

  const handleSend = (e) => {
    e.preventDefault();
    appendMessage();
  };

  // Example handlePrompt function (adjust as needed)
  const handlePrompt = (promptText) => {
    setMessages(prevMessages => [...prevMessages, { id: uuidv4(), content: promptText, role: 'user' }]);
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        {/* Page setup (headers, inputs, etc.) remains unchanged */}
        {/* Insert the rest of your page setup here */}
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='chatbot-header pb-6'>
            {/* Header content */}
          </div>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={message.id} content={message.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          {messages.length === 0 && <PromptSuggestionRow onPromptClick={handlePrompt} />}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            <input
              onChange={(e) => setInput(e.target.value)}
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
          {...{ useRag, llm, similarityMetric, setConfiguration }}
        />
      </main>
    </>
  );
}
