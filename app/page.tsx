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
import AudioRecorder from '../components/AudioRecorder';

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

  const handleCloseModal = () => {
    setShowModal(false);
    window.location.reload(); // Reload the app
  };

  const [showModal, setShowModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    handleSubmit(e, {
      options: { body: { useRag, llm, similarityMetric, sessionId } },
    });
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handlePrompt = (promptText) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg, { options: { body: { useRag, llm, similarityMetric } } });
  };

  const startRecording = () => {
    console.log('Recording started');
  };

  const onRecordingComplete = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm"); // 'audio' is the field name expected by the server
  
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Transcription:', data.transcription);
  
      handleInputChange({
        target: { value: data.transcription },
      } as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error('Error uploading audio:', error);
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
          .h-screen-adjusted {
            height: calc(var(--vh, 1vh) * 100);
          }
        `}
      </style>
      <main className="flex h-screen-adjusted flex-col items-center justify-center pt-0">
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
                    <path d="M19.14 13.4006C19.18 13.1006 19.2 12.7906 19.2 12.4606C19.2 12.1406 19.18 11.8206 19.13 11.5206L21.16 9.94057C21.34 9.80057 21.39 9.53057 21.28 9.33057L19.36 6.01057C19.24 5.79057 18.99 5.72057 18.77 5.79057L16.38 6.75057C15.88 6.37057 15.35 6.05057 14.76 5.81057L14.4 3.27057C14.36 3.03057 14.16 2.86057 13.92 2.86057H10.08C9.83999 2.86057 9.64999 3.03057 9.60999 3.27057L9.24999 5.81057C8.65999 6.05057 8.11999 6.38057 7.62999 6.75057L5.23999 5.79057C5.01999 5.71057 4.76999 5.79057 4.64999 6.01057L2.73999 9.33057C2.61999 9.54057 2.65999 9.80057 2.85999 9.94057L4.88999 11.5206C4.83999 11.8206 4.79999 12.1506 4.79999 12.4606C4.79999 12.7706 4.81999 13.1006 4.86999 13.4006L2.83999 14.9806C2.65999 15.1206 2.60999 15.3906 2.71999 15.5906L4.63999 18.9106C4.75999 19.1306 5.00999 19.2006 5.22999 19.1306L7.61999 18.1706C8.11999 18.5506 8.64999 18.8706 9.23999 19.1106L9.59999 21.6506C9.64999 21.8906 9.83999 22.0606 10.08 22.0606H13.92C14.16 22.0606 14.36 21.8906 14.39 21.6506L14.75 19.1106C15.34 18.8706 15.88 18.5506 16.37 18.1706L18.76 19.1306C18.98 19.2106 19.23 19.1306 19.35 18.9106L21.27 15.5906C21.39 15.3706 21.34 15.1206 21.15 14.9806L19.14 13.4006ZM12 16.0606C10.02 16.0606 8.39999 14.4406 8.39999 12.4606C8.39999 10.4806 10.02 8.86057 12 8.86057C13.98 8.86057 15.6 10.4806 15.6 12.4606C15.6 14.4406 13.98 16.0606 12 16.0606Z" />
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
            <AudioRecorder onRecordingComplete={onRecordingComplete} startRecording={startRecording} />
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
                  <path
                    d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z"
                    fill="currentColor"
                  />
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
