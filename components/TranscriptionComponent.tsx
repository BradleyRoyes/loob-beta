// components/TranscriptionComponent.tsx
import { useState } from 'react';

export default function TranscriptionComponent() {
  const [transcription, setTranscription] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = (event.target as HTMLFormElement).elements.namedItem('file') as HTMLInputElement;

    if (file.files && file.files[0]) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        // Assert that reader.result is a string before calling split
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64 }),
          });

          const data = await response.json();
          setTranscription(data.transcription);
        }
      };

      reader.readAsDataURL(file.files[0]);
    }
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