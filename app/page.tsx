    "use client";
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
    import NeuronVisual from "../components/NeuronVisual"; // Ensure this import path is correct

    export default function Page() {
      const { append, messages, input, handleInputChange, handleSubmit } = useChat();
      const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

      const messagesEndRef = useRef(null);
      const [configureOpen, setConfigureOpen] = useState(false);
      const [transcribedText, setTranscribedText] = useState("");
      const [showNeuronVisual, setShowNeuronVisual] = useState(false);

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      useEffect(() => {
        scrollToBottom();
      }, [messages]);

      const handleTranscription = (transcription: string) => {
        setTranscribedText(transcription);
        append({ id: uuidv4(), content: transcription, role: "user" });
      };

      const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSubmit(e, { options: { body: { useRag, llm, similarityMetric } } });
      };

      const handlePrompt = (promptText: string) => {
        append({ id: uuidv4(), content: promptText, role: "user" });
      };

      return (
        <>
          <main className="flex h-screen flex-col items-center justify-center">
            <section className="chatbot-section flex flex-col w-full h-full rounded-md p-2 md:p-6">
              <div className="chatbot-header pb-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide">
                    Loob The App
                  </h1>
                  <div className="flex gap-1">
                    <ThemeButton />
                    <button onClick={() => setShowNeuronVisual(!showNeuronVisual)} className="p-2 text-lg">
                      Visualize
                    </button>
                    <button onClick={() => setConfigureOpen(true)} className="p-2 text-lg">
                      Configure
                    </button>
                  </div>
                </div>
                <p className="text-lg md:text-xl mt-2 md:mt-4 font-medium">
                  Welcome to Loob Laboratories. A Journey Journal like no other. We are glad you are here.
                </p>
              </div>
              <div className="flex-1 relative overflow-y-auto my-4 md:my-6">
                <div className="absolute w-full overflow-x-hidden">
                  {messages.map((message, index) => (
                    <Bubble key={`message-${index}`} content={message} />
                  ))}
                  {transcribedText && (
                    <Bubble key="transcribed-text" content={{ role: "user", content: transcribedText }} />
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
              <PromptSuggestionRow onPromptClick={handlePrompt} />
              <AudioRecorder onTranscription={handleTranscription} />
              <form className="flex gap-2" onSubmit={handleSend}>
                <input
                  onChange={handleInputChange}
                  value={input}
                  className="flex-1 text-sm md:text-base rounded-md p-2"
                  placeholder="Send a message..."
                />
                <button type="submit" className="rounded-md px-2.5 text-lg">
                  Send
                </button>
              </form>
              <Footer />
            </section>
            {showNeuronVisual && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-10">
                <div className="bg-white p-4 rounded-lg max-w-md max-h-full overflow-auto">
                  {NeuronVisual ? <NeuronVisual /> : <p>Visualization not available.</p>}
                  <button onClick={() => setShowNeuronVisual(false)} className="mt-4 bg-red-500 text-white p-2 rounded-md">
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