import React, { useState, useEffect, useRef } from "react";

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null); // Use 'any' here

  useEffect(() => {
    // Check for browser compatibility and initialize SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("This browser doesn't support SpeechRecognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep recording until manually stopped
    recognition.interimResults = true; // Useful for real-time feedback, can be set to false if not needed

    recognition.onresult = (event: any) => {
      // Use 'any' here
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript) // Use 'any' here
        .join("");
      onTranscription(transcript); // Callback with the transcription
    };

    recognition.onerror = (event: any) => {
      // Use 'any' here
      setError(`Error occurred in speech recognition: ${event.error}`);
    };

    speechRecognitionRef.current = recognition;
    return () => {
      recognition.stop(); // Ensure to stop recognition when component unmounts
    };
  }, [onTranscription]);

  const toggleRecording = () => {
    if (!speechRecognitionRef.current) return;

    if (recording) {
      speechRecognitionRef.current.stop();
      setRecording(false);
    } else {
      speechRecognitionRef.current.start();
      setRecording(true);
      setError(null); // Reset error state on new recording session
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full text-white ${
          recording ? "bg-red-500" : "bg-green-500"
        }`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;
