import { useState, ChangeEvent } from 'react';

const AudioRecorder = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prevChunks) => [...prevChunks, e.data]);
        }
      };
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Convert audio chunks to Blob
  const createAudioBlob = () => {
    return new Blob(audioChunks, { type: 'audio/wav' });
  };

  // Handle file upload
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioChunks([file]);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const audioBlob = createAudioBlob();
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Send formData to the /api/chat/transcribe endpoint
    fetch('/api/chat/transcribe', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Transcribed text:', data.text);
      })
      .catch((error) => {
        console.error('Error transcribing audio:', error);
      });
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFile} />
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <button onClick={handleSubmit} disabled={audioChunks.length === 0}>
        Transcribe Audio
      </button>
    </div>
  );
};

export default AudioRecorder;e