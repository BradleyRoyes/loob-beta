import React from 'react';
import { useWhisper } from '@chengsokdara/use-whisper';

const AudioRecorder = () => {
  const {
    recording,
    speaking,
    transcript,
    transcripting,
    pauseRecording,
    startRecording,
    stopRecording,
  } = useWhisper({
    apiKey: process.env.OPENAI_API_TOKEN,
  });

  return (
    <div>
      <p>Recording: {recording}</p>
      <p>Speaking: {speaking}</p>
      <p>Transcripting: {transcripting}</p>
      <p>Transcribed Text: {transcript && transcript.text}</p>
      <button onClick={() => startRecording()}>Start</button>
      <button onClick={() => pauseRecording()}>Pause</button>
      <button onClick={() => stopRecording()}>Stop</button>
    </div>
  );
};

export default AudioRecorder;
