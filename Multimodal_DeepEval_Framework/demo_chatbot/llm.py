"""Text-generation call for the demo chatbot, provider-agnostic."""
from __future__ import annotations
import os
from openai import OpenAI
from groq import Groq

SYSTEM_PROMPT = (
    "You are Aria, a helpful multimodal customer-support assistant for a "
    "consumer electronics store. Answer clearly and concisely. If you are "
    "given visual context (frame descriptions from a video) or a voice "
    "transcript, treat it as ground truth about what the customer showed "
    "or said."
)


def _client_and_model():
    provider = os.getenv("CHAT_PROVIDER", "openai")
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    groq_key = os.environ.get("GROQ_API_KEY", "")

    # Fallback to Ollama if key is a dummy or not provided
    is_dummy_openai = not openai_key or openai_key.startswith("sk-...") or "YOUR_OPENAI_API_KEY" in openai_key
    is_dummy_groq = not groq_key or groq_key.startswith("gsk_...") or "YOUR_GROQ_API_KEY" in groq_key

    if provider == "groq" and not is_dummy_groq:
        return Groq(api_key=groq_key), os.getenv(
            "CHAT_MODEL_GROQ", "llama-3.3-70b-versatile"
        )
    
    if provider == "openai" and not is_dummy_openai:
        return OpenAI(api_key=openai_key), os.getenv(
            "CHAT_MODEL_OPENAI", "gpt-4o-mini"
        )

    # Use local Ollama as fallback
    return OpenAI(base_url="http://127.0.0.1:11434/v1", api_key="ollama"), os.getenv(
        "CHAT_MODEL_OLLAMA", "llama3.2:3b"
    )


def generate_reply(message: str, history: list[dict] | None = None, extra_context: str | None = None) -> str:
    """history: list of {"role": "user"|"assistant", "content": str}"""
    client, model = _client_and_model()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if extra_context:
        messages.append({"role": "system", "content": f"Additional context:\n{extra_context}"})
    messages.extend(history or [])
    messages.append({"role": "user", "content": message})

    resp = client.chat.completions.create(model=model, messages=messages, temperature=0.3)
    return resp.choices[0].message.content
