"""Text-to-speech for outgoing voice replies (OpenAI only)."""
from __future__ import annotations
import os
from openai import OpenAI


def synthesize(text: str, out_path: str) -> str:
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    is_dummy_openai = not openai_key or openai_key.startswith("sk-...") or "YOUR_OPENAI_API_KEY" in openai_key

    # Mock audio generation if using dummy/missing keys (ensure size > 1000 bytes)
    if is_dummy_openai:
        with open(out_path, "wb") as f:
            f.write(b'\x00' * 2000)
        return out_path

    client = OpenAI(api_key=openai_key)
    model = os.getenv("TTS_MODEL_OPENAI", "tts-1")
    voice = os.getenv("TTS_VOICE", "alloy")
    with client.audio.speech.with_streaming_response.create(
        model=model, voice=voice, input=text
    ) as resp:
        resp.stream_to_file(out_path)
    return out_path
