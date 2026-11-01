"""Subsystem D — Aria: a demo multimodal (text/voice/video) support chatbot.

Endpoints:
  GET  /health
  POST /chat/text    {message, history}                 -> {reply, mode:"text"}
  POST /chat/voice    multipart(audio=<file>, history)   -> {reply, transcript, audio_reply_b64, mode:"voice"}
  POST /chat/video    multipart(video=<file>, question)  -> {reply, mode:"video"}

This app is the "app under test." It is intentionally simple: it exists so
the framework/ test suite has a real, live, multimodal target to evaluate.
Point the framework at this app, OR at your own live chatbot, via
framework/targets_config.yaml.
"""
from __future__ import annotations

import base64
import json
import os
import tempfile

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from llm import generate_reply
from stt import transcribe
from tts import synthesize
from vision import describe_video

load_dotenv()

app = FastAPI(title="Aria — Multimodal Demo Chatbot")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "aria-multimodal-chatbot"}


@app.post("/chat/text")
def chat_text(payload: dict):
    message = payload["message"]
    history = payload.get("history", [])
    reply = generate_reply(message, history)
    return {"reply": reply, "mode": "text", "model": os.getenv("CHAT_PROVIDER", "openai")}


@app.post("/chat/voice")
async def chat_voice(audio: UploadFile = File(...), history: str = Form("[]")):
    history_list = json.loads(history) if history else []

    with tempfile.NamedTemporaryFile(suffix=os.path.splitext(audio.filename or "in.wav")[1] or ".wav", delete=False) as tmp_in:
        tmp_in.write(await audio.read())
        in_path = tmp_in.name

    transcript = transcribe(in_path)
    reply_text = generate_reply(transcript, history_list)

    audio_b64 = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_out:
            out_path = tmp_out.name
        synthesize(reply_text, out_path)
        with open(out_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:  # TTS is best-effort; transcript+reply still returned
        audio_b64 = None

    return {
        "reply": reply_text,
        "transcript": transcript,
        "audio_reply_b64": audio_b64,
        "mode": "voice",
    }


@app.post("/chat/video")
async def chat_video(video: UploadFile = File(...), question: str = Form(...)):
    suffix = os.path.splitext(video.filename or "in.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_in:
        tmp_in.write(await video.read())
        in_path = tmp_in.name

    reply = describe_video(in_path, question)
    return {"reply": reply, "mode": "video"}
