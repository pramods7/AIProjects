"""Golden cases for voice-modality evaluation.

Each entry points at a short audio clip (WAV/MP3) of a spoken question,
plus the transcript you expect STT to produce (for WER scoring) and
keywords the reply should cover (for relevancy scoring).

Replace sample_media/*.wav with real recorded speech before running for
real — the bundled files are silent placeholders so the project runs
end-to-end without extra setup.
"""
import os

_MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "sample_media")

VOICE_GOLDENS = [
    {
        "audio_path": os.path.join(_MEDIA_DIR, "sample_question_1.wav"),
        "expected_transcript": "What is your return policy?",
        "expected_keywords": ["30 day", "return", "refund"],
        "max_latency_sec": 8.0,
    },
    {
        "audio_path": os.path.join(_MEDIA_DIR, "sample_question_2.wav"),
        "expected_transcript": "Do you ship internationally?",
        "expected_keywords": ["ship", "countries"],
        "max_latency_sec": 8.0,
    },
]
