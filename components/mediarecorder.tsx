import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void; // Assuming transcription is a string
}

function AudioRecorder({ onTranscription }: AudioRecorderProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // State for audio playback

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement>(null);

  // Function to start recording
  const startRecording = async () => {
    if (recorder && recorder.state === 'recording') {
      setRecordingStatus('Recording is already in progress');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingStatus('Audio recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (audioChunks.length === 0) {
          setRecordingStatus('No audio data recorded');
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' }); // Use 'audio/mpeg' for example; choose the appropriate type
        setAudio(audioBlob);
        setRecordingStatus('Recording stopped');
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecordingStatus('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus(`Error starting recording: ${error.message}`);
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setRecorder(null);
      setRecordingStatus('Recording stopped');
    } else {
      setRecordingStatus('No active recording to stop');
    }
  };

  // Function to send audio to API
  const sendAudio = async () => {
    if (!audio) {
      setRecordingStatus('No audio to send');
      return;
    }

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: audio,
        headers: {
          'Content-Type': 'audio/mpeg', // Use the appropriate content type for the audio format
        },
      });

      if (response.ok) {
        const { transcription } = await response.json();
        setRecordingStatus('Audio sent successfully');
        onTranscription(transcription);
      } else {
        setRecordingStatus(`Error sending audio: ${response.status} ${response.statusText}`);
        console.error('Error sending audio:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      setRecordingStatus(`Error sending audio: ${error.message}`);
    }
  };

  // Function to play the recorded audio
  const playAudio = () => {
    if (audio && audioRef.current) {
      const audioURL = URL.createObjectURL(audio);
      audioRef.current.src = audioURL;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Function to stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div>
      <div>{recordingStatus}</div>
      <button onClick={startRecording} disabled={recorder?.state === 'recording'}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!recorder || recorder.state !== 'recording'}>
        Stop Recording
      </button>
      <button onClick={sendAudio} disabled={!audio}>
        Send Audio
      </button>
      <button onClick={playAudio} disabled={!audio || isPlaying}>
        Play Audio
      </button>
      <button onClick={stopAudio} disabled={!isPlaying}>
        Stop Audio
      </button>
      <audio ref={audioRef}></audio>
    </div>
  );
}

export default AudioRecorder;
