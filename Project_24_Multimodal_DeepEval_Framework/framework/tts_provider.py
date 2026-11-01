"""TTS used by the framework itself in voice 'pipeline' mode, so audio-reply
validity/latency metrics can still run even against a text-only target."""
from __future__ import annotations
import os
import tempfile
from openai import OpenAI


def synthesize(text: str) -> str:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = os.getenv("TTS_MODEL_OPENAI", "tts-1")
    voice = os.getenv("TTS_VOICE", "alloy")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        out_path = tmp.name
    with client.audio.speech.with_streaming_response.create(
        model=model, voice=voice, input=text
    ) as resp:
        resp.stream_to_file(out_path)
    return out_path
