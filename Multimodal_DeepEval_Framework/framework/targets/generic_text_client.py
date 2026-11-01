"""Generic text client — works against ANY chatbot whose config is described
in targets_config.yaml. No code changes needed to point at a new bot."""
from __future__ import annotations
from dataclasses import dataclass
import requests

from config import load_target_config


@dataclass
class TextReply:
    reply: str
    raw: dict


class GenericTextClient:
    def __init__(self, cfg: dict | None = None, timeout: int = 30):
        cfg = cfg or load_target_config()
        self.base_url = cfg["base_url"].rstrip("/")
        self.t = cfg["text"]
        self.timeout = timeout

    def health(self) -> bool:
        try:
            requests.get(f"{self.base_url}/health", timeout=5).raise_for_status()
            return True
        except Exception:
            return False

    def chat(self, message: str, history: list[dict] | None = None) -> TextReply:
        payload = {self.t["request_field"]: message}
        if "history_field" in self.t:
            payload[self.t["history_field"]] = history or []

        r = requests.request(
            self.t.get("method", "POST"),
            f"{self.base_url}{self.t['endpoint']}",
            json=payload,
            timeout=self.timeout,
        )
        r.raise_for_status()
        d = r.json()
        return TextReply(reply=d[self.t["response_field"]], raw=d)
