import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble'; // Adjust path as needed
import Footer from '../components/Footer'; // Adjust path as needed
import AudioRecorder from '../components/mediarecorder'; // Adjust path as needed
import { randomUUID } from 'crypto'; 

const Page = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTranscription = (transcription) => {
    setInput(transcription); // Append transcription to input field
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { id: randomUUID(), content: input, role: 'user' };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput(''); // Clear input field after sending
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='flex-1 relative overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} content={message.content} />
              // Adjust Bubble component as needed
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className='flex h-[40px] gap-2' onSubmit={handleSubmit}>
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              className='flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2'
              placeholder='Send a message...'
            />
            <button type="submit" className='flex items-center justify-center rounded-md px-2.5'>
              Send
            </button>
          </form>
          <AudioRecorder onTranscription={handleTranscription} />
          <Footer /> {/* Adjust Footer component as needed */}
        </section>
      </main>
    </>
  );
};

export default Page;
