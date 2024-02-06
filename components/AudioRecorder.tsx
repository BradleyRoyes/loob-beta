import React, { useState, useEffect, useRef, useCallback } from "react";

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Using `any` to bypass the direct use of SpeechRecognition type
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically check and use SpeechRecognition without type declaration
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = "en-US";

      speechRecognitionRef.current.onresult = (event: any) => {
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

      speechRecognitionRef.current.onerror = (event: any) => {
        console.error("SpeechRecognition error:", event.error);
        setError(`Error occurred in speech recognition: ${event.error}`);
      };
    } else {
      console.error("This browser doesn't support SpeechRecognition.");
      setError("This browser doesn't support SpeechRecognition.");
    }
  }, [onTranscription]);

  const startRecording = useCallback(() => {
    if (speechRecognitionRef.current && !recording) {
      speechRecognitionRef.current.start();
      setRecording(true);
      setError(null);
    }
  }, [recording]);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current && recording) {
      speechRecognitionRef.current.stop();
      setRecording(false);
    }
  }, [recording]);

  return (
    <div className="flex items-center">
      <button
        onClick={() => (recording ? stopRecording() : startRecording())}
        className={`p-2 rounded-full ${
          recording ? "bg-red-500" : "bg-green-500"
        } text-white`}
      >
        {/* SVG Microphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="bi bi-mic"
        >
          <path d="M11 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          <path d="M11 7V5a3 3 0 1 0-6 0v2a3 3 0 1 0 6 0z" />
          <path d="M6.5 10.5a.5.5 0 0 1 .5.5V14h.5a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.5v-3a.5.5 0 0 1 .5-.5z" />
        </svg>
      </button>
      {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;
