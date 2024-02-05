import React, { useState, useEffect, useRef, useCallback } from "react";

// Extend the Window interface for webkit prefixed SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  // Declare types for SpeechRecognitionEvent if not already available
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
}

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const speechRecognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser compatibility and initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      speechRecognition.current.lang = "en-US";

      speechRecognition.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript.trim()) {
          onTranscription(finalTranscript.trim());
        }
      };

      speechRecognition.current.onerror = (
        event: SpeechRecognitionErrorEvent,
      ) => {
        console.error("SpeechRecognition error:", event.error);
        setError(`Error occurred in speech recognition: ${event.error}`);
      };
    } else {
      console.error("This browser doesn't support SpeechRecognition.");
      setError("This browser doesn't support SpeechRecognition.");
    }
  }, [onTranscription]);

  const startRecording = useCallback(() => {
    if (speechRecognition.current && !recording) {
      speechRecognition.current.start();
      setRecording(true);
      setError(null); // Clear any existing errors when starting a new session
    }
  }, [recording]);

  const stopRecording = useCallback(() => {
    if (speechRecognition.current && recording) {
      speechRecognition.current.stop();
      setRecording(false);
    }
  }, [recording]);

  return (
    <div>
      <button
        onClick={() => (recording ? stopRecording() : startRecording())}
        style={{ backgroundColor: recording ? "red" : "green", color: "white" }}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;
