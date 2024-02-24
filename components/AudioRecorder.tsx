import React, { useState, useRef } from 'react';
import axios from 'axios';

function AudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Use useRef to keep a mutable reference

    const startRecording = () => {
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

                mediaRecorderRef.current = mediaRecorder; // Store the mediaRecorder instance in the ref
            });
    };

    const stopRecording = () => {
        if (!recording || !mediaRecorderRef.current) return;

        mediaRecorderRef.current.stop(); // Use the ref to access the mediaRecorder instance
        setRecording(false);
    };

    const sendAudio = async () => {
        if (!audioBlob) {
            console.error('No audio to send');
            return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        try {
            const response = await axios.post('/transcribe-audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Transcription:', response.data);
            // Handle the response data (transcription result) as needed
        } catch (error) {
            console.error('Error sending audio for transcription:', error);
        }
    };

    return (
        <div>
            <button onClick={startRecording} disabled={recording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!recording}>Stop Recording</button>
            <button onClick={sendAudio} disabled={!audioBlob}>Send Audio</button>
        </div>
    );
}

export default AudioRecorder;
