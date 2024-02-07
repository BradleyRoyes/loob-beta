import { useState } from 'react';
import axios from 'axios'; // Assuming you have axios installed

const AudioRecorder = () => {
  const [audioChunks, setAudioChunks] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleStartRecording = () => {
    setRecording(true);
    setAudioChunks([]);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
          setAudioChunks(prevChunks => [...prevChunks, event.data]);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);
        };
        mediaRecorder.start();
      })
      .catch(error => console.error('Error accessing microphone:', error));
  };

  const handleStopRecording = () => {
    setRecording(false);
    mediaRecorder.stop();
  };

  const handleSaveRecording = async () => {
    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audioData', audioBlob);

      // Make a POST request to your API route to transcribe the audio
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Transcription:', response.data.transcription);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  return (
    <div>
      {recording ? (
        <button onClick={handleStopRecording}>Stop Recording</button>
      ) : (
        <button onClick={handleStartRecording}>Start Recording</button>
      )}
      {audioUrl && (
        <div>
          <audio controls src={audioUrl} />
          <button onClick={handleSaveRecording}>Save Recording</button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
