"""Shared pytest fixtures: judge model, generic clients, goldens."""
from __future__ import annotations
import os
import sys
import pytest
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
load_dotenv()

from llm_providers.factory import build_judge
from config import load_target_config
from targets.generic_text_client import GenericTextClient
from targets.generic_voice_client import GenericVoiceClient
from targets.generic_video_client import GenericVideoClient
from datasets.text_goldens import TEXT_GOLDENS, ADVERSARIAL_TEXT_GOLDENS
from datasets.voice_goldens import VOICE_GOLDENS
from datasets.video_goldens import VIDEO_GOLDENS


@pytest.fixture(scope="session")
def judge():
    return build_judge()


@pytest.fixture(scope="session")
def target_cfg():
    return load_target_config()


@pytest.fixture(scope="session")
def text_client(target_cfg):
    return GenericTextClient(target_cfg)


@pytest.fixture(scope="session")
def voice_client(target_cfg):
    return GenericVoiceClient(target_cfg)


@pytest.fixture(scope="session")
def video_client(target_cfg):
    return GenericVideoClient(target_cfg)


@pytest.fixture(scope="session")
def text_goldens():
    return TEXT_GOLDENS


@pytest.fixture(scope="session")
def adversarial_text_goldens():
    return ADVERSARIAL_TEXT_GOLDENS


@pytest.fixture(scope="session")
def voice_goldens():
    return VOICE_GOLDENS


@pytest.fixture(scope="session")
def video_goldens():
    return VIDEO_GOLDENS
