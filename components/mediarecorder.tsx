// Function to send audio to API
const sendAudio = async () => {
  if (!audio) {
    setRecordingStatus('No audio to send');
    return;
  }

  const formData = new FormData();
  formData.append("audio", audio, "recording.mp3"); // Append the audio file to FormData

  try {
    const response = await fetch('app/api/chat/Whisper.js', { // Update API route path if necessary
      method: 'POST',
      body: formData, // Send FormData
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
