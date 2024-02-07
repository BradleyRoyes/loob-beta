// components/AudioRecorder.tsx

import { useState, ChangeEvent } from 'react';
import axios from 'axios';

const AudioRecorder = () => {
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [convertedText, setConvertedText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append('file', file);
      setFormData(data);

      if (file.size > 25 * 1024 * 1024) {
        alert('Please upload an audio file less than 25MB');
        return;
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prevChunks) => [...prevChunks, event.data]);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFormData(new FormData());
        setAudioChunks([]);
      });

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    mediaRecorder.stop();
  };

  const sendAudio = async () => {
    setLoading(true);
    const res = await fetch('/api/chat/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setLoading(false);
    setConvertedText(data.text);
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFile} />
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      {audioUrl && <audio controls src={audioUrl} />}
      <button onClick={sendAudio} disabled={!audioUrl}>
        {loading ? 'Transcribing...' : 'Transcribe Audio'}
      </button>
      {convertedText && <div>{convertedText}</div>}
    </div>
  );
};

export default AudioRecorder;
