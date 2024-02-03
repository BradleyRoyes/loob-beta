import React, { useState } from 'react';

interface AudioRecorderProps {
  onTranscription: (transcription: any) => void;
}

function AudioRecorder({ onTranscription }: AudioRecorderProps) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string | null>(null);

  // Function to start recording
  const startRecording = async () => {
    try {
      // Check if recorder is already active
      if (recorder && recorder.state === 'recording') {
        setRecordingStatus('Recording is already in progress');
        return;
      }

      // Check if audio recording is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingStatus('Audio recording is not supported in this browser');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (audioChunks.length === 0) {
          setRecordingStatus('No audio data recorded');
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioBlob);
        setRecordingStatus('Recording stopped');
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecordingStatus('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus('Error starting recording');
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    try {
      // Check if recorder is active
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
        // Reset recorder state
        setRecorder(null);
        setRecordingStatus('Recording stopped');
      } else {
        setRecordingStatus('No active recording to stop');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingStatus('Error stopping recording');
    }
  };

  // Function to send audio to API
  const sendAudio = async () => {
    try {
      // Check if audio data is available
      if (!audio) {
        setRecordingStatus('No audio to send');
        return;
      }

      const formData = new FormData();
      formData.append('audio', audio);

      const response = await fetch('app/api/chat/transcribe.tsx', {
        method: 'POST',
        body: formData, // Send the audio blob as form data
      });

      if (response.ok) {
        const data = await response.json();
        setRecordingStatus('Audio sent successfully');
        onTranscription(data); // Call the onTranscription function with the transcribed data
      } else {
        setRecordingStatus('Error sending audio');
        console.error('Error sending audio:', response.status);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      setRecordingStatus('Error sending audio');
    }
  };

  return (
    <div>
      <div>{recordingStatus}</div>
      <button onClick={startRecording} disabled={recorder && recorder.state === 'recording'}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={recorder && recorder.state !== 'recording'}>
        Stop Recording
      </button>
      <button onClick={sendAudio} disabled={!audio}>
        Send Audio
      </button>
    </div>
  );
}

export default AudioRecorder;
