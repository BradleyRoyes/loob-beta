import React, { useState, useEffect, ChangeEvent } from 'react';

const WhisperTranscriptionComponent = () => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [convertedText, setConvertedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);
      data.append("model", "whisper-1");
      data.append("language", "en");
      setFormData(data);

      // check if the size is less than 25MB
      if (file.size > 25 * 1024 * 1024) {
        alert("Please upload an audio file less than 25MB");
        return;
      }
    }
  };

  const sendAudio = async () => {
  setLoading(true);
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`, // Use your environment variable name here
    },
    method: "POST",
    body: formData,
  });

    const data = await res.json();
    setLoading(false);

    setConvertedText(data.text);
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
