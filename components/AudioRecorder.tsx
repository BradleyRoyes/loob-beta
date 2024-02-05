import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as any;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = "en-US";

      speechRecognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
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
    <div>
      <button
        onClick={() => recording ? stopRecording() : startRecording()}
        style={{ backgroundColor: recording ? "red" : "green", color: "white" }}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;

