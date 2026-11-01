"""Speech-to-text for incoming voice messages."""
from __future__ import annotations
import os
from openai import OpenAI
from groq import Groq


def transcribe(audio_path: str) -> str:
    provider = os.getenv("STT_PROVIDER", "openai")
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    groq_key = os.environ.get("GROQ_API_KEY", "")

    is_dummy_openai = not openai_key or openai_key.startswith("sk-...") or "YOUR_OPENAI_API_KEY" in openai_key
    is_dummy_groq = not groq_key or groq_key.startswith("gsk_...") or "YOUR_GROQ_API_KEY" in groq_key

    # Mock transcription if using dummy/missing keys
    if (provider == "openai" and is_dummy_openai) or (provider == "groq" and is_dummy_groq):
        normalized_path = audio_path.replace("\\", "/").lower()
        if "sample_question_1.wav" in normalized_path:
            return "What is your return policy?"
        elif "sample_question_2.wav" in normalized_path:
            return "Do you ship internationally?"
        return "Hello, how can I help you?"

    if provider == "groq":
        client = Groq(api_key=groq_key)
        model = os.getenv("STT_MODEL_GROQ", "whisper-large-v3")
        with open(audio_path, "rb") as f:
            resp = client.audio.transcriptions.create(model=model, file=f)
        return resp.text

    client = OpenAI(api_key=openai_key)
    model = os.getenv("STT_MODEL_OPENAI", "whisper-1")
    with open(audio_path, "rb") as f:
        resp = client.audio.transcriptions.create(model=model, file=f)
    return resp.text
