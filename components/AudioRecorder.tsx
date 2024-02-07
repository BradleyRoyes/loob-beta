import React, { useState, useEffect, useRef } from "react";

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>(""); // Used to accumulate transcription
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false; // Stops automatically after a period of silence
      speechRecognitionRef.current.interimResults = false; // We're only interested in the final result

      speechRecognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript; // Capture the final result
        setTranscription(transcript); // Set the final transcription result
      };

      speechRecognitionRef.current.onerror = (event: any) => {
        setError(`Error occurred in speech recognition: ${event.error}`);
      };
    } else {
      setError("This browser doesn't support SpeechRecognition.");
    }
  }, []);

  const toggleRecording = () => {
    if (recording) {
      speechRecognitionRef.current.stop();
      setRecording(false);
    } else {
      setTranscription(""); // Reset transcription for a new session
      speechRecognitionRef.current.start();
      setRecording(true);
      setError(null);
    }
  };

  useEffect(() => {
    if (!recording && transcription) {
      // Call onTranscription when stopping the recording and if there's transcription available
      onTranscription(transcription);
    }
  }, [recording, transcription, onTranscription]);

  return (
    <div className="flex items-center">
      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full text-white ${recording ? "bg-red-500" : "bg-green-500"}`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;
