"""Infra smoke test: is the target chatbot alive at all?"""
import pytest


@pytest.mark.infra
def test_target_health(text_client):
    assert text_client.health(), "Target chatbot /health endpoint did not respond"
