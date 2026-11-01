"""Reads JUDGE_PROVIDER and builds the appropriate CompatibleJudge."""
from __future__ import annotations
import os
from llm_providers.base import CompatibleJudge

_PROVIDER_DEFAULTS = {
    "openai": dict(base_url=None, env_key="OPENAI_API_KEY", model_env="JUDGE_MODEL_OPENAI", default_model="gpt-4o-mini"),
    "groq": dict(base_url="https://api.groq.com/openai/v1", env_key="GROQ_API_KEY", model_env="JUDGE_MODEL_GROQ", default_model="openai/gpt-oss-120b"),
    "ollama": dict(base_url="http://localhost:11434/v1", env_key=None, model_env="JUDGE_MODEL_OLLAMA", default_model="gpt-oss:20b"),
}


def build_judge(provider: str | None = None, model: str | None = None) -> CompatibleJudge:
    provider = provider or os.getenv("JUDGE_PROVIDER", "openai")
    cfg = _PROVIDER_DEFAULTS[provider]
    api_key = os.environ[cfg["env_key"]] if cfg["env_key"] else "ollama"
    model_name = model or os.getenv(cfg["model_env"], cfg["default_model"])
    return CompatibleJudge(model=model_name, base_url=cfg["base_url"], api_key=api_key)
