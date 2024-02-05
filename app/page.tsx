"use client";
import React, { useEffect, useRef, useState } from "react";
import Bubble from "../components/Bubble";
import { useChat } from "../hooks/useChat"; // Adjust the path as necessary
import Footer from "../components/Footer";
import Configure from "../components/Configure";
import PromptSuggestionRow from "../components/PromptSuggestions/PromptSuggestionsRow";
import ThemeButton from "../components/ThemeButton";
import useConfiguration from "../hooks/useConfiguration"; // Adjust the path as necessary
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
