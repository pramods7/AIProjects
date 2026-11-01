"""Subsystem E — Live Dashboard.

- Lists every metric card (text/voice/video/infra), grouped by modality.
- Runs any card on demand against the configured target (targets_config.yaml)
  and shows pass/fail + judge reasoning.
- Includes a "Live Tester" panel to manually try text/voice/video against
  the target directly (bypassing DeepEval) for quick sanity checks.
"""
from __future__ import annotations
import os
import sys
import tempfile

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from dashboard.registry import REGISTRY, MODALITIES
from dashboard.runner import run_node
from config import load_target_config
from targets.generic_text_client import GenericTextClient
from targets.generic_voice_client import GenericVoiceClient
from targets.generic_video_client import GenericVideoClient

app = FastAPI(title="Multimodal DeepEval Dashboard")
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    cfg = load_target_config()
    cards_by_modality = {m: [c for c in REGISTRY if c["modality"] == m] for m in MODALITIES}
    return templates.TemplateResponse(
        request,
        "index.html",
        {"cards_by_modality": cards_by_modality, "target_name": cfg.get("name"), "base_url": cfg.get("base_url")},
    )


@app.post("/api/run/{card_id}")
def api_run(card_id: str, provider: str | None = None, judge_model: str | None = None):
    card = next((c for c in REGISTRY if c["id"] == card_id), None)
    if not card:
        return {"error": f"unknown card_id {card_id}"}
    result = run_node(card["node"], provider=provider, judge_model=judge_model)
    return {"card": card, **result}


@app.post("/api/live/text")
def live_text(payload: dict):
    client = GenericTextClient(load_target_config())
    reply = client.chat(payload["message"], payload.get("history", []))
    return {"reply": reply.reply}


@app.post("/api/live/voice")
async def live_voice(audio: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await audio.read())
        path = tmp.name
    client = GenericVoiceClient(load_target_config())
    reply = client.send(path)
    return {"reply": reply.reply, "transcript": reply.transcript, "latency_sec": reply.latency_sec}


@app.post("/api/live/video")
async def live_video(video: UploadFile = File(...), question: str = Form(...)):
    suffix = os.path.splitext(video.filename or "in.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await video.read())
        path = tmp.name
    client = GenericVideoClient(load_target_config())
    reply = client.send(path, question)
    return {"reply": reply.reply}
