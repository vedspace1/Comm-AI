from flask import Flask, request, jsonify
from transformers import pipeline
import speech_recognition as sr
import language_tool_python

# Initialize Flask app
app = Flask(__name__)

# Initialize Sentiment Analysis Model
sentiment_pipeline = pipeline("sentiment-analysis")

# Initialize LanguageTool for Grammar Correction
tool = language_tool_python.LanguageTool('en-US')

# Speech-to-Text Endpoint using Vosk or SpeechRecognition
@app.route('/transcribe', methods=['POST'])
def transcribe():
    file = request.files['audio']
    recognizer = sr.Recognizer()
    with sr.AudioFile(file) as source:
        audio = recognizer.record(source)
    try:
        transcript = recognizer.recognize_google(audio)  # Free Google ASR
    except sr.UnknownValueError:
        return jsonify({"error": "Could not understand the audio"}), 400
    except sr.RequestError:
        return jsonify({"error": "Speech Recognition API unavailable"}), 503
    return jsonify({"transcript": transcript})

# Sentiment Analysis Endpoint
@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.json
    text = data.get("text")
    result = sentiment_pipeline(text)
    return jsonify({"sentiment": result})

# Grammar Correction Endpoint
@app.route('/correct', methods=['POST'])
def grammar_correct():
    data = request.json
    text = data.get("text")
    matches = tool.check(text)
    corrected_text = tool.correct(text)
    return jsonify({"corrected_text": corrected_text, "matches": len(matches)})

if __name__ == '__main__':
    app.run()
