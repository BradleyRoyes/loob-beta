import React, { useState } from 'react';
import Whisper from 'whisper-nodejs';

interface AudioRecorderProps {
  onTranscription: (transcription: any) => void;
}

function AudioRecorder({ onTranscription }: AudioRecorderProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);

  // Start recording or stop recording
  const toggleRecording = async () => {
    if (!recording) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        let audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudio(audioBlob);
        };

        mediaRecorder.start();
        setRecorder(mediaRecorder);
        setRecording(true);
      }
    } else {
      recorder?.stop();
      // Reset recorder state
      setRecorder(null);
      setRecording(false);
    }
  };

  // Send audio to API for transcription
  const sendAudio = async () => {
    if (audio) {
      const whisper = new Whisper('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'); // Replace with your OpenAI API key
      const modelName = 'whisper-large'; // Replace with your desired model
      try {
        const text = await whisper.transcribe(audio, modelName);
        onTranscription(text); // Call the onTranscription function with the transcribed text
      } catch (error) {
        console.error('Error transcribing audio:', error);
      }
    }
  };

  return (
    <div>
      <button
        onClick={toggleRecording}
        style={{ backgroundColor: 'white', color: 'black' }}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {recording && (
        <button
          onClick={sendAudio}
          disabled={!audio}
          style={{ backgroundColor: 'white', color: 'black' }}
        >
          Send Audio
        </button>
      )}
    </div>
  );
}

export default AudioRecorder;
