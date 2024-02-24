import React, { useState } from 'react';
import axios from 'axios';

function AudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                setRecording(true);

                const audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks);
                    setAudioBlob(audioBlob);
                    setRecording(false);
                });
            });
    };

    const stopRecording = () => {
        if (recording) {
            // This assumes mediaRecorder is in the scope; adjust as necessary.
            mediaRecorder.stop();
        }
    };

    const sendAudio = () => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        axios.post('/transcribe-audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(response => {
            console.log('Transcription:', response.data);
            // Handle the response data (transcription result) as needed
        }).catch(error => {
            console.error('Error sending audio for transcription:', error);
        });
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
