import { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import OpenAI from 'openai';

const AudioRecorder = () => {
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [convertedText, setConvertedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  // Initialize OpenAI with API key
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Handle file upload
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append('file', file);
      data.append('model', 'whisper-1');
      data.append('language', 'en');
      setFormData(data);

      if (file.size > 25 * 1024 * 1024) {
        alert('Please upload an audio file less than 25MB');
        return;
      }
    }
  };

  // Start recording audio
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

  // Stop recording audio
  const stopRecording = () => {
    mediaRecorder.stop();
  };

  // Send audio for transcription
  const sendAudio = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const text = data.text;

      // Use OpenAI to format and display the transcribed text
      const formattedText = text.replace(/(\.)(\S)/g, '$1 $2'); // Add space after period if no space exists
      setConvertedText(formattedText);
      setDisplayText(formattedText); // Start displaying text letter by letter
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
    setLoading(false);
  };

  // Display text letter by letter with a delay
  useEffect(() => {
    const timer = setInterval(() => {
      const currentChar = convertedText.charAt(index);
      const nextChar = convertedText.charAt(index + 1);
      setDisplayText((prevDisplayText) => {
        if (currentChar === '.' && nextChar !== ' ') {
          return prevDisplayText + currentChar + ' ';
        }
        return prevDisplayText + currentChar;
      });
      setIndex((prevIndex) => prevIndex + 1);
    }, 10);

    return () => clearInterval(timer);
  }, [convertedText, index]);

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFile} />
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      {audioUrl && <audio controls src={audioUrl} />}
      <button onClick={sendAudio} disabled={!audioUrl}>
        {loading ? 'Transcribing...' : 'Transcribe Audio'}
      </button>
      {displayText && <div>{displayText}</div>}
    </div>
  );
};

export default AudioRecorder;
