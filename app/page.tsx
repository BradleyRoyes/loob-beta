// first
// <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
//   <path d="M19.14 13.4006C19.18 13.1006 19.2 12.7906 19.2 12.4606C19.2 12.1406 19.18 11.8206 19.13 11.5206L21.16 9.94057C21.34 9.80057 21.39 9.53057 21.28 9.33057L19.36 6.01057C19.24 5.79057 18.99 5.72057 18.77 5.79057L16.38 6.75057C15.88 6.37057 15.35 6.05057 14.76 5.81057L14.4 3.27057C14.36 3.03057 14.16 2.86057 13.92 2.86057H10.08C9.83999 2.86057 9.64999 3.03057 9.60999 3.27057L9.24999 5.81057C8.65999 6.05057 8.11999 6.38057 7.62999 6.75057L5.23999 5.79057C5.01999 5.71057 4.76999 5.79057 4.64999 6.01057L2.73999 9.33057C2.61999 9.54057 2.65999 9.80057 2.85999 9.94057L4.88999 11.5206C4.83999 11.8206 4.79999 12.1506 4.79999 12.4606C4.79999 12.7706 4.81999 13.1006 4.86999 13.4006L2.83999 14.9806C2.65999 15.1206 2.60999 15.3906 2.71999 15.5906L4.63999 18.9106C4.75999 19.1306 5.00999 19.2006 5.22999 19.1306L7.61999 18.1706C8.11999 18.5506 8.64999 18.8706 9.23999 19.1106L9.59999 21.6506C9.64999 21.8906 9.83999 22.0606 10.08 22.0606H13.92C14.16 22.0606 14.36 21.8906 14.39 21.6506L14.75 19.1106C15.34 18.8706 15.88 18.5506 16.37 18.1706L18.76 19.1306C18.98 19.2106 19.23 19.1306 19.35 18.9106L21.27 15.5906C21.39 15.3706 21.34 15.1206 21.15 14.9806L19.14 13.4006ZM12 16.0606C10.02 16.0606 8.39999 14.4406 8.39999 12.4606C8.39999 10.4806 10.02 8.86057 12 8.86057C13.98 8.86057 15.6 10.4806 15.6 12.4606C15.6 14.4406 13.98 16.0606 12 16.0606Z" />
// </svg>

// second
// <svg width="20" height="20" viewBox="0 0 20 20">
//   <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
// </svg>

"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from "react";
import Bubble from "../components/Bubble";
import { useChat } from "ai/react";
import Footer from "../components/Footer";
import Configure from "../components/Configure";
import PromptSuggestionRow from "../components/PromptSuggestions/PromptSuggestionsRow";
import ThemeButton from "../components/ThemeButton";
import useConfiguration from "./hooks/useConfiguration";
import AudioRecorder from "../components/AudioRecorder";
import { v4 as uuidv4 } from "uuid";
import NeuronVisual from "../components/NeuronVisual"; // Make sure the path is correct

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showNeuronVisual, setShowNeuronVisual] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
  };

  const handlePrompt = (promptText: string) => {
    append({ id: uuidv4(), content: promptText, role: "user" });
  };

  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <section className="chatbot-section flex flex-col w-full max-w-4xl h-full rounded-md p-4 md:p-8 shadow-lg bg-white dark:bg-gray-800">
          <div className="chatbot-header mb-4 flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Loob The App
            </h1>
            <div className="flex items-center gap-2">
              <ThemeButton />
              <button onClick={() => setShowNeuronVisual(true)} className="text-lg p-2 bg-blue-500 text-white rounded-md">
                Visualize
              </button>
              <button onClick={() => setConfigureOpen(true)} className="text-lg p-2 bg-green-500 text-white rounded-md">
                Configure
              </button>
            </div>
          </div>
          <div className="chat-content flex-1 overflow-y-auto mb-4">
            {messages.map((message, index) => (
              <Bubble key={index} content={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <PromptSuggestionRow onPromptClick={handlePrompt} />
          <AudioRecorder />
          <form className="chat-input flex gap-2" onSubmit={handleSend}>
            <input className="flex-1 p-2 rounded-md border border-gray-300" placeholder="Send a message..." value={input} onChange={handleInputChange} />
            <button className="p-2 bg-blue-600 text-white rounded-md" type="submit">
              Send
            </button>
          </form>
          <Footer />
        </section>
        {showNeuronVisual && (
          <div className="neuron-visual-modal fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="modal-content bg-white dark:bg-gray-700 rounded-lg p-4 max-w-3xl w-full h-3/4 overflow-y-auto">
              <NeuronVisual />
              <button onClick={() => setShowNeuronVisual(false)} className="mt-4 py-2 px-4 bg-red-600 text-white rounded-md">
                Close
              </button>
            </div>
          </div>
        )}
        <Configure
          isOpen={configureOpen}
          onClose={() => setConfigureOpen(false)}
          useRag={useRag}
          llm={llm}
          similarityMetric={similarityMetric}
          setConfiguration={setConfiguration}
        />
      </main>
    </>
  );
}
