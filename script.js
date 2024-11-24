const startRecord = document.getElementById('startRecord');
const stopRecord = document.getElementById('stopRecord');

let mediaRecorder;
let audioChunks = [];

startRecord.addEventListener('click', async () => {
    startRecord.disabled = true;
    stopRecord.disabled = false;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];

        // Send the audio to the backend
        const formData = new FormData();
        formData.append('audio', audioBlob);

        const response = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        // Update UI with results
        document.getElementById('transcript').textContent = data.transcript;

        // Perform Sentiment Analysis
        fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.transcript }),
        })
        .then(response => response.json())
        .then(sentimentData => {
            document.getElementById('sentiment').textContent = sentimentData.sentiment[0].label;
        });

        // Perform Grammar Correction
        fetch('http://localhost:5000/correct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.transcript }),
        })
        .then(response => response.json())
        .then(grammarData => {
            document.getElementById('grammar').textContent = grammarData.corrected_text;
        });
    };

    mediaRecorder.start();
});

stopRecord.addEventListener('click', () => {
    stopRecord.disabled = true;
    startRecord.disabled = false;
    mediaRecorder.stop();
});
