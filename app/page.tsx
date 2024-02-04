import React, { useState, useRef, useEffect } from 'react';
import Bubble from '../components/Bubble'; // Adjust the import path as needed
import Footer from '../components/Footer'; // Adjust the import path as needed
import AudioRecorder from '../components/AudioRecorder'; // Adjust the import path as needed
import { randomUUID } from 'crypto'; 

const Page = () => {
  const [messages, setMessages] = useState([]); // Stores all messages
  const [input, setInput] = useState(''); // Manages the current input field value
  const messagesEndRef = useRef(null); // For auto-scrolling to the latest message

  // Function to handle the transcription received from the AudioRecorder
  const handleTranscription = (transcription) => {
    setInput(transcription); // Update the input field with the transcription
  };

  // Function to append a new message and clear the input field
  const appendMessage = () => {
    if (!input.trim()) return; // Ignore empty messages
    const newMessage = { id: randomUUID(), content: input };
    setMessages([...messages, newMessage]);
    setInput(''); // Clear the input field after sending
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center">
        <section className='flex flex-col w-full h-full rounded-md p-2 md:p-6'>
          <div className='flex-1 overflow-y-auto my-4 md:my-6'>
            {messages.map((message, index) => (
              <Bubble key={message.id} content={message.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-2"
            />
            <button onClick={appendMessage} className="p-2">Send</button>
          </div>
          <AudioRecorder onTranscription={handleTranscription} />
          <Footer />
        </section>
      </main>
    </>
  );
};

export default Page;
