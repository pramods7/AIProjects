"""Voice modality: sanity-check that a synthesized audio reply exists and is
non-trivially sized (a lightweight stand-in for full audio-quality scoring,
which is out of scope for DeepEval's text-based metrics)."""
import os
import pytest

from datasets.voice_goldens import VOICE_GOLDENS


@pytest.mark.voice
@pytest.mark.infra
@pytest.mark.parametrize("golden", VOICE_GOLDENS)
def test_voice_tts_reply_is_valid_audio(golden, voice_client):
    reply = voice_client.send(golden["audio_path"], synthesize_reply_audio=True)
    if reply.audio_reply_path is None:
        pytest.skip("Target/pipeline did not return a synthesized audio reply")
    assert os.path.getsize(reply.audio_reply_path) > 1000, "Audio reply file is suspiciously small/empty"
