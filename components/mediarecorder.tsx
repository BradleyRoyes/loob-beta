import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
}

const AudioRecorder = ({ onTranscription }: AudioRecorderProps) => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);

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

        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        setAudio(audioBlob);
        setRecordingStatus('Recording stopped. Ready to send for transcription.');
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setRecordingStatus('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus(`Error starting recording: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setRecorder(null);
      setRecordingStatus('Recording stopped. Please send the audio for transcription.');
    } else {
      setRecordingStatus('No active recording to stop');
    }
  };

  const sendAudio = async () => {
    if (!audio) {
      setRecordingStatus('No audio to send');
      return;
    }

    const formData = new FormData();
    formData.append('file', audio);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    };

    try {
      const response = await axios.post('/api/whisper', formData, config);

      if (response.status === 200) {
        const { transcription } = response.data;
        setRecordingStatus('Transcription received successfully');
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

  const playAudio = () => {
    if (audio && audioRef.current) {
      const audioURL = URL.createObjectURL(audio);
      audioRef.current.src = audioURL;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }
  }, []);

  return (
    <div>
      <div>Status: {recordingStatus}</div>
      <button onClick={startRecording} disabled={recorder?.state === 'recording'}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!recorder || recorder.state !== 'recording'}>
        Stop Recording
      </button>
      <button onClick={sendAudio} disabled={!audio}>
        Send Audio for Transcription
      </button>
      <button onClick={playAudio} disabled={!audio || isPlaying}>
        Play Audio
      </button>
      <button onClick={stopAudio} disabled={!isPlaying}>
        Stop Audio
      </button>
      <audio ref={audioRef} controls style={{ display: 'none' }}></audio>
    </div>
  );
};

export default AudioRecorder;
