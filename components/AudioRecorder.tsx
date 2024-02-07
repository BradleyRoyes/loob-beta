import React, { useState, useEffect, useRef } from 'react';

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionBuffer, setTranscriptionBuffer] = useState<string>('');

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("This browser doesn't support SpeechRecognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const interimTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setTranscriptionBuffer(prevBuffer => prevBuffer + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Error occurred in speech recognition: ${event.error}`);
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!speechRecognitionRef.current) return;

    if (!recording) {
      // Start recording
      setTranscriptionBuffer('');
      speechRecognitionRef.current.start();
      setError(null);
    } else {
      // Stop recording and send the complete transcription
      if (transcriptionBuffer) {
        onTranscription(transcriptionBuffer);
      }
      speechRecognitionRef.current.stop();
    }
    setRecording(prevRecording => !prevRecording);
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full text-white ${recording ? 'bg-red-500' : 'bg-green-500'}`}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">Error: {error}</p>}
    </div>
  );
};

export default AudioRecorder;
