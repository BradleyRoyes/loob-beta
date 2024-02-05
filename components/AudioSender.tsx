// Example function to call the API from the frontend
async function transcribeAudio(audioBlob) {
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = async () => {
    const base64AudioMessage = reader.result.split(',')[1];

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64AudioMessage }),
      });
      const data = await response.json();
      console.log('Transcription:', data.transcription);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };
}
