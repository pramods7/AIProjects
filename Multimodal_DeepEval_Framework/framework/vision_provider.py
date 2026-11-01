"""Vision/video grounding used by the framework itself in video 'pipeline'
mode (i.e. when the target chatbot has no native video understanding)."""
from __future__ import annotations
import base64
import os
from typing import List
import cv2
from openai import OpenAI


def extract_frames(video_path: str, max_frames: int = 6) -> List[str]:
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    step = max(total // max_frames, 1)
    frames = []
    idx = 0
    while cap.isOpened() and len(frames) < max_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ok, frame = cap.read()
        if not ok:
            break
        ok, buf = cv2.imencode(".jpg", frame)
        if ok:
            frames.append(f"data:image/jpeg;base64,{base64.b64encode(buf).decode()}")
        idx += step
    cap.release()
    return frames


def describe_video(video_path: str, question: str) -> str:
    frames = extract_frames(video_path)
    if not frames:
        return "No frames could be extracted from the video."

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = os.getenv("VISION_MODEL_OPENAI", "gpt-4o-mini")
    content = [{
        "type": "text",
        "text": f"Describe what is visible in these video frames, grounded and factual, "
                f"in support of answering: {question!r}",
    }]
    for f in frames:
        content.append({"type": "image_url", "image_url": {"url": f}})

    resp = client.chat.completions.create(
        model=model, messages=[{"role": "user", "content": content}], temperature=0.1,
    )
    return resp.choices[0].message.content
