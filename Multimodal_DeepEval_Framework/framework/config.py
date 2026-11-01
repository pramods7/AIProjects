"""Loads the target chatbot definition from targets_config.yaml (or a path
given via the TARGET_CONFIG env var) so every client/test stays generic and
config-driven instead of hardcoded to one chatbot."""
from __future__ import annotations
import os
from pathlib import Path
import yaml

_DEFAULT_PATH = Path(__file__).parent / "targets_config.yaml"


def load_target_config(path: str | None = None) -> dict:
    cfg_path = Path(path or os.getenv("TARGET_CONFIG", str(_DEFAULT_PATH)))
    with open(cfg_path, "r") as f:
        data = yaml.safe_load(f)
    return data["target"]
