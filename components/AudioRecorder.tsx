import React, { useState, useEffect, useRef, ChangeEvent } from 'react';

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null); // Use 'any' here

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("This browser doesn't support SpeechRecognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Ensure continuous recording
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      handleTranscription(transcript);
    };

    recognition.onerror = (event: any) => {
      setError(`Error occurred in speech recognition: ${event.error}`);
    };

    recognition.onend = () => {
      if (recording) {
        recognition.start(); // Restart recognition if it stops unexpectedly
      }
    };

    speechRecognitionRef.current = recognition;

    return () => {
      recognition.stop();
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

  const handleTranscription = (transcription: string) => {
    const event: React.ChangeEvent<HTMLInputElement> = {
      target: { value: transcription },
      currentTarget: null,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      nativeEvent: new Event('input'),
      persist: () => {},
      preventDefault: () => {},
      isDefaultPrevented: () => false,
      stopPropagation: () => {},
      isPropagationStopped: () => false,
      timeStamp: Date.now(),
      type: 'change',
    };

    handleInputChange(event);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Handle transcription result received in the input field
    console.log('Transcription:', event.target.value);
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
