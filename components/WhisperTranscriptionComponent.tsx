import React, { useState } from 'react';

interface FormData {
  append(name: string, value: any): void;
}

const WhisperTranscriptionComponent = ({ onTranscription }: { onTranscription: (transcription: string) => void }) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [convertedText, setConvertedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);
      data.append("model", "whisper-1");
      data.append("language", "en");
      setFormData(data);

      // Check file size
      if (file.size > 25 * 1024 * 1024) {
        alert("Please upload an audio file less than 25MB");
        return;
      }
    }
  };

  const sendAudio = async () => {
    setLoading(true);

    if (!formData) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      const transcription = data.text;
      setConvertedText(transcription);
      onTranscription(transcription);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };


  return (
    <div>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFile}
      />
      <button onClick={sendAudio} disabled={!formData || loading}>
        {loading ? 'Processing...' : 'Send Audio'}
      </button>
      {convertedText && (
        <div>{convertedText}</div>
      )}
    </div>
  );
};

export default WhisperTranscriptionComponent;
