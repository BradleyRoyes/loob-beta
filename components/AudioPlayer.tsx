import React, { useState } from 'react';

interface AudioPlayerProps {
  audio: Blob | null; // Audio Blob received from AudioRecorder
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audio }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handlePlayAudio = () => {
    if (audio) {
      const audioURL = URL.createObjectURL(audio);
      const audioElement = new Audio(audioURL);
      audioElement.play();
      setIsPlaying(true);
    }
  };

  return (
    <div>
      <button onClick={handlePlayAudio} disabled={!audio || isPlaying}>
        Play Audio
      </button>
    </div>
  );
};

export default AudioPlayer;
