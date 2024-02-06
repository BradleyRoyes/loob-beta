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
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M7.5 1a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0v-5A2.5 2.5 0 0 0 7.5 1zm-1 2.5a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0v-5z" />
          <path d="M4.81 8.157c-.577-.58-1.135-.862-1.616-.927a.5.5 0 0 0-.388.806c.226.227.538.572.878 1.025C4.395 10.042 5 11.57 5 13v1a.5.5 0 0 0 1 0v-1c0-1.43.605-2.958 1.315-4.939.34-.453.652-.798.878-1.025a.5.5 0 0 0-.388-.806c-.481.065-1.039.347-1.616.927a.5.5 0 0 1-.708 0zM8 14.5a2 2 0 1 1-4 0 .5.5 0 0 1 1 0 1 1 0 1 0 2 0 .5.5 0 0 1 1 0z" />
        </svg>
      </button>
      {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;
