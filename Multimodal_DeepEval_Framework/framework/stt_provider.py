"""STT used by the framework itself in voice 'pipeline' mode (i.e. when the
target chatbot only has a text API and can't accept audio directly)."""
from __future__ import annotations
import os
from openai import OpenAI
from groq import Groq


def transcribe(audio_path: str) -> str:
    provider = os.getenv("STT_PROVIDER", "openai")
    if provider == "groq":
        client = Groq(api_key=os.environ["GROQ_API_KEY"])
        model = os.getenv("STT_MODEL_GROQ", "whisper-large-v3")
    else:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        model = os.getenv("STT_MODEL_OPENAI", "whisper-1")
    with open(audio_path, "rb") as f:
        resp = client.audio.transcriptions.create(model=model, file=f)
    return resp.text
