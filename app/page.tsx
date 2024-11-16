"use client"; // Mark the parent component as a client component
import React, { useEffect, useRef, useState } from "react";
import Bubble from "../components/Bubble";
import { useChat, Message } from "ai/react";
import Footer from "../components/Footer";
import Configure from "../components/Configure";
import ThemeButton from "../components/ThemeButton";
import useConfiguration from "./hooks/useConfiguration";
import Dashboard from "../components/dashboard";
import MessageCollector from "../components/MessageCollector";
import { v4 as uuidv4 } from "uuid";
import SplashScreen from "../components/SplashScreen";
import AnalyseButton from "../components/AnalyseButton";
import PromptSuggestionRow from "../components/PromptSuggestions/PromptSuggestionsRow";
import ModalOverlay from "../components/ModalOverlay";
import AudioRecorder from "../components/AudioRecorder";

export default function Page() {
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();
  const [sessionId] = useState(uuidv4());
  const messagesEndRef = useRef<HTMLElement | null>(null);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showNeuronVisual, setShowNeuronVisual] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const chatContainerRef = useRef(null);

  const [collectedJsonMessages, setCollectedJsonMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    window.location.reload(); // Reload the app
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, {
      options: { body: { useRag, llm, similarityMetric, sessionId } },
    });
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handlePrompt = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg, { options: { body: { useRag, llm, similarityMetric } } });
  };

  const startRecording = () => {
    console.log("Recording started");
  };

  const onRecordingComplete = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Transcription:", data.transcription);

      handleInputChange({
        target: { value: data.transcription },
      } as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  const handleEnter = (promptText?: string) => {
    setShowSplash(false);
    if (promptText) {
      handlePrompt(promptText);
    }
  };

  const [showAnalyseButton, setShowAnalyseButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnalyseButton(true);
    }, 45000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function adjustAppHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }

    adjustAppHeight();
    window.addEventListener("resize", adjustAppHeight);
    return () => window.removeEventListener("resize", adjustAppHeight);
  }, []);

  const handleAnalyseButtonClick = () => {
    const analyseMessage = "analyse my messages";
    append({ content: analyseMessage, role: "user" });
    setShowModal(true);

    setTimeout(() => {
      const endChatMessage = "End Chat";
      append({ content: endChatMessage, role: "user" });
    }, 5000);
  };

  if (showNeuronVisual) {
    return (
      <>
        <Dashboard />
        <button
          onClick={() => setShowNeuronVisual(false)}
          className="button-dash flex rounded-md fixed top-4 right-4 items-center justify-center px-2.5"
          style={{ fontWeight: "500" }}
        >
          Back to Chat
        </button>
      </>
    );
  }

  return showSplash ? (
    <SplashScreen onEnter={handleEnter} />
  ) : (
    <>
      <style>
        {`
          /* Fade-in animation */
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* Apply animation to the main container */
          .fade-in {
            animation: fadeIn 1.5s ease-in-out;
          }

          .h-screen-adjusted {
            height: calc(var(--vh, 1vh) * 100);
          }
        `}
      </style>
      <main className="fade-in flex h-screen-adjusted flex-col items-center justify-center pt-0">
        {showModal && <ModalOverlay onClose={() => setShowModal(false)} />}

        <section
          ref={chatContainerRef}
          className="chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full rounded-md p-2 md:p-6"
        >
          <div className="chatbot-header pb-6">
            <div className="flex justify-between items-center">
              <h1 className="chatbot-text-primary text-6xl md:text-7xl font-extrabold tracking-wide">
                <span className="text-5xl md:text-7xl">loob</span>
                <span className="text-lg md:text-xl font-normal"> at GamesGround</span>
              </h1>
              <div className="flex gap-1">
                <ThemeButton />
                <button onClick={() => setConfigureOpen(true)}>
                  <svg
                    width="24"
                    height="25"
                    viewBox="0 0 24 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="..." />
                  </svg>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNeuronVisual(true)}
                    className="button-dash rounded-md items-center justify-center px-2.5 py-2"
                    style={{ fontWeight: "500" }}
                  >
                    Back Stage
                  </button>
                </div>
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
          {!messages || (messages.length === 0 && (
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          ))}
          <div className="button-row">
            <AudioRecorder
              onRecordingComplete={onRecordingComplete}
              startRecording={startRecording}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <form className="flex flex-1 gap-2" onSubmit={handleSend}>
              <input
                onChange={(e) => handleInputChange(e)}
                value={input}
                className="chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2"
                placeholder="Send a message..."
              />
              <button
                type="submit"
                className="chatbot-send-button flex rounded-md items-center justify-center px-2.5"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="..." fill="currentColor" />
                </svg>
                <span className="hidden origin:block font-semibold text-sm ml-2">
                  Send
                </span>
              </button>
            </form>
            <button
              onClick={handleCloseModal}
              className="button-dash rounded-md items-center justify-center px-2.5 py-2"
              style={{ fontWeight: "500" }}
            >
              End Chat
            </button>
          </div>
          <Footer />
        </section>
        {configureOpen && (
          <Configure
            isOpen={configureOpen}
            onClose={() => setConfigureOpen(false)}
            useRag={useRag}
            llm={llm}
            similarityMetric={similarityMetric}
            setConfiguration={setConfiguration}
          />
        )}
      </main>
    </>
  );
}
