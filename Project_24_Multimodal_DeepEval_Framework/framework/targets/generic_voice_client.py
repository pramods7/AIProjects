"""Generic voice client.

Two modes, selected in targets_config.yaml -> target.voice.mode:

- "native":   the target chatbot itself accepts audio (multipart upload) and
              returns a reply (and optionally a transcript / audio reply).
              We just call it and read back whatever fields are configured.

- "pipeline": the target only exposes a text endpoint. We do STT ourselves
              (framework/stt_provider.py) to get a transcript, call the
              generic text client with that transcript, and optionally do
              TTS on the reply so voice-specific metrics (transcription
              accuracy, end-to-end latency, audio validity) can still run.
"""
from __future__ import annotations
import json
import time
from dataclasses import dataclass, field
import requests

from config import load_target_config
from targets.generic_text_client import GenericTextClient
from stt_provider import transcribe
from tts_provider import synthesize


@dataclass
class VoiceReply:
    reply: str
    transcript: str
    audio_reply_path: str | None = None
    latency_sec: float = 0.0
    raw: dict = field(default_factory=dict)


class GenericVoiceClient:
    def __init__(self, cfg: dict | None = None, timeout: int = 60):
        cfg = cfg or load_target_config()
        self.base_url = cfg["base_url"].rstrip("/")
        self.v = cfg["voice"]
        self.timeout = timeout
        self._text_client = GenericTextClient(cfg, timeout=timeout)

    def send(self, audio_path: str, history: list[dict] | None = None,
              synthesize_reply_audio: bool = False) -> VoiceReply:
        start = time.time()

        if self.v.get("mode", "native") == "native":
            with open(audio_path, "rb") as f:
                files = {self.v["audio_field"]: (audio_path, f, "audio/wav")}
                data = {}
                if "history_field" in self.v:
                    data[self.v["history_field"]] = json.dumps(history or [])
                r = requests.post(
                    f"{self.base_url}{self.v['endpoint']}",
                    files=files, data=data, timeout=self.timeout,
                )
            r.raise_for_status()
            d = r.json()
            reply = d[self.v["response_text_field"]]
            transcript = d.get(self.v.get("response_transcript_field", ""), "")
            audio_field = self.v.get("response_audio_field")
            audio_reply_path = None
            if audio_field and d.get(audio_field):
                audio_reply_path = _save_b64_audio(d[audio_field])
            latency = time.time() - start
            return VoiceReply(reply, transcript, audio_reply_path, latency, d)

        # pipeline mode: STT -> text endpoint -> optional TTS
        transcript = transcribe(audio_path)
        text_reply = self._text_client.chat(transcript, history)
        audio_reply_path = None
        if synthesize_reply_audio:
            audio_reply_path = synthesize(text_reply.reply)
        latency = time.time() - start
        return VoiceReply(text_reply.reply, transcript, audio_reply_path, latency, text_reply.raw)


def _save_b64_audio(b64_data: str) -> str:
    import base64, tempfile
    raw = base64.b64decode(b64_data)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(raw)
        return f.name
