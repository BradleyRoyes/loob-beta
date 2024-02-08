// components/TranscriptionComponent.js
import { useState } from 'react';

export default function TranscriptionComponent() {
  const [transcription, setTranscription] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const file = event.target.elements.file.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64 }),
      });

      const data = await response.json();
      setTranscription(data.transcription);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept="audio/*" />
        <button type="submit">Transcribe</button>
      </form>
      {transcription && <p>Transcription: {transcription}</p>}
    </div>
  );
}