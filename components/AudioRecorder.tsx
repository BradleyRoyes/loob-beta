import React, { useState, useEffect, useRef } from "react";

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>(""); // State to store the complete transcription text
  // Using `any` to bypass the direct use of SpeechRecognition type
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically check and use SpeechRecognition without type declaration
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false; // Set continuous to false
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
          const newTranscription = finalTranscript.trim();
          setTranscriptionText(prevText => prevText + " " + newTranscription); // Append new transcription to the existing text
          onTranscription(newTranscription);
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

  const toggleRecording = () => {
    if (!recording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
        setRecording(true);
        setError(null);
      }
    } else {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop(); // Stop the recording
        setRecording(false);
      }
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggleRecording}
        className="p-2 rounded-full text-white"
        style={{
          backgroundColor: recording ? "#b36f6a" : "#ffd998",
        }}
      >
        {/* SVG Microphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 512 512"
        >
          <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z" />
          <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z" />
        </svg>
      </button>
      {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
      <textarea
        value={transcriptionText}
        onChange={() => {}} // Disable typing in the textarea
        className="ml-4 p-2 border border-gray-300 rounded"
        placeholder="Transcription..."
        rows={4}
        cols={50}
      />
    </div>
  );
};

export default AudioRecorder;
