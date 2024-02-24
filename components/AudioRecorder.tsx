import React, { useState, useRef } from 'react';

function AudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const startRecording = () => {
        setError('');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                setRecording(true);
                const audioChunks: BlobPart[] = [];
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks);
                    setAudioBlob(audioBlob);
                };
                mediaRecorderRef.current = mediaRecorder;
            }).catch(err => {
                setError('Failed to start recording. Please ensure you have given permission to use the microphone.');
            });
    };

    const stopRecording = () => {
        if (!recording || !mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        setRecording(false);
    };

    const sendAudio = async () => {
        if (!audioBlob) {
            console.error('No audio to send');
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setTranscription(data.transcription);
                console.log('Transcription:', data.transcription);
            } else {
                throw new Error(data.message || 'Failed to transcribe audio');
            }
        } catch (error) {
            console.error('Error sending audio for transcription:', error);
            setError('Error sending audio for transcription.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            {error && <p>Error: {error}</p>}
            <button onClick={startRecording} disabled={recording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!recording}>Stop Recording</button>
            <button onClick={sendAudio} disabled={!audioBlob || isUploading}>Send Audio</button>
            {isUploading && <p>Uploading and transcribing...</p>}
            {transcription && <p>Transcription: {transcription}</p>}
        </div>
    );
}

export default AudioRecorder;