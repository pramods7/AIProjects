"""Generic video client.

- "native":   the target chatbot accepts a video file directly (multipart)
              along with a question, and returns a grounded reply.

- "pipeline": the target has no video understanding. We extract frames
              ourselves (framework/vision_provider.py), get a frame-grounded
              description/answer from our own vision model, and use that as
              context when calling the target's text endpoint.
"""
from __future__ import annotations
from dataclasses import dataclass, field
import requests

from config import load_target_config
from targets.generic_text_client import GenericTextClient
from vision_provider import describe_video


@dataclass
class VideoReply:
    reply: str
    raw: dict = field(default_factory=dict)


class GenericVideoClient:
    def __init__(self, cfg: dict | None = None, timeout: int = 90):
        cfg = cfg or load_target_config()
        self.base_url = cfg["base_url"].rstrip("/")
        self.v = cfg["video"]
        self.timeout = timeout
        self._text_client = GenericTextClient(cfg, timeout=timeout)

    def send(self, video_path: str, question: str) -> VideoReply:
        if self.v.get("mode", "native") == "native":
            with open(video_path, "rb") as f:
                files = {self.v["video_field"]: (video_path, f, "video/mp4")}
                data = {self.v["question_field"]: question}
                r = requests.post(
                    f"{self.base_url}{self.v['endpoint']}",
                    files=files, data=data, timeout=self.timeout,
                )
            r.raise_for_status()
            d = r.json()
            return VideoReply(reply=d[self.v["response_text_field"]], raw=d)

        # pipeline mode: our own vision model grounds the video, then we
        # hand that description to the target's text endpoint as context
        grounded_description = describe_video(video_path, question)
        text_reply = self._text_client.chat(
            f"{question}\n\n[Video context]\n{grounded_description}"
        )
        return VideoReply(reply=text_reply.reply, raw=text_reply.raw)
