// Mark the component for client-side execution only
"use client";

// Import necessary React and other library functionalities
import React, { useEffect, useRef, useState } from 'react';
import Bubble from '../components/Bubble'; // Import the Bubble component for message display
import { useChat } from 'ai/react'; // Custom hook for chat functionality
import Footer from '../components/Footer'; // Import the Footer component for the page footer
import Configure from '../components/Configure'; // Component for configuration settings
import PromptSuggestionRow from '../components/PromptSuggestions/PromptSuggestionsRow'; // Component for displaying prompt suggestions
import ThemeButton from '../components/ThemeButton'; // Button for toggling theme
import useConfiguration from './hooks/useConfiguration'; // Custom hook for fetching configuration settings
import AudioRecorder from '../components/mediarecorder'; // Component for audio recording functionality
import { v4 as uuidv4 } from 'uuid'; // UUID generation function for session identification

// Main component definition
export default function Page() {
  // Destructure functionalities from the useChat custom hook
  const { append, messages, input, handleInputChange, handleSubmit } = useChat();
  // Destructure configuration settings from the useConfiguration custom hook
  const { useRag, llm, similarityMetric, setConfiguration } = useConfiguration();

  const messagesEndRef = useRef(null); // Ref for auto-scrolling to the latest message
  const [configureOpen, setConfigureOpen] = useState(false); // State for managing the visibility of the Configure component
  const [transcribedText, setTranscribedText] = useState(""); // State for storing the text transcribed from audio

  // Generate a unique session ID only once per session
  const [sessionID] = useState(uuidv4());

  // Effect hook for auto-scrolling to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle the transcription of audio to text
  const handleTranscription = (transcription) => {
    setTranscribedText(transcription); // Update the state with the transcribed text
    // Append the transcribed message to the chat, along with a unique message ID and the session ID
    append({ id: uuidv4(), content: transcription, role: 'user', sessionID });
  };

  // Function to handle the submission of text messages
  const handleSend = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    // Submit the message only if there is input text
    if (input.trim()) {
      // Append the input message to the chat, along with a unique message ID and the session ID
      append({ id: uuidv4(), content: input, role: 'user', sessionID });
      handleInputChange(''); // Clear the input field after sending the message
    }
  };

  // Function to handle the selection of suggested prompts
  const handlePrompt = (promptText) => {
    // Append the selected prompt to the chat, along with a unique message ID and the session ID
    const msg = { id: uuidv4(), content: promptText, role: 'user', sessionID };
    append(msg);
  };
          {/* Transcription and message input section */}
          <form className='flex h-[40px] gap-2' onSubmit={handleSend}>
            {/* Input field for user message */}
            <input 
              onChange={handleInputChange} 
              value={input} 
              className='chatbot-input flex-1 text-sm md:text-base outline-none bg-transparent rounded-md p-2' 
              placeholder='Send a message...'
              aria-label="Message input" // Accessibility improvement
            />
            {/* Send button */}
            <button type="submit" className='chatbot-send-button flex rounded-md items-center justify-center px-2.5 origin:px-3'>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"> {/* Icon for visual indication */}
                <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
              </svg>
              <span className='hidden origin:block font-semibold text-sm ml-2'>Send</span> {/* Text hidden on smaller screens */}
            </button>
            {/* Audio Recorder Component */}
            <AudioRecorder onTranscription={handleTranscription} />
          </form>
          
          {/* Footer Component */}
          <Footer />

          {/* Configuration Modal */}
          {/* This section allows for the configuration of the chat interface, including themes and AI parameters */}
          <Configure
            isOpen={configureOpen} // Controls visibility based on state
            onClose={() => setConfigureOpen(false)} // Handler to close modal
            useRag={useRag} // Toggle for using Retrieval-Augmented Generation
            llm={llm} // Selected language model
            similarityMetric={similarityMetric} // Metric for sorting related conversations
            setConfiguration={setConfiguration} // Function to update configuration settings
          />
        </section>
      </main>
    </>
  );
}

