"""Voice modality: end-to-end turnaround time (STT + LLM [+ TTS]) stays
within an acceptable bound for a live conversational experience."""
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase

from datasets.voice_goldens import VOICE_GOLDENS
from metrics.latency_metric import LatencyMetric


@pytest.mark.voice
@pytest.mark.performance
@pytest.mark.parametrize("golden", VOICE_GOLDENS)
def test_voice_latency(golden, voice_client):
    reply = voice_client.send(golden["audio_path"])
    tc = LLMTestCase(
        input="[voice input]",
        actual_output=reply.reply,
        completion_time=reply.latency_sec,
    )
    assert_test(tc, [LatencyMetric(max_seconds=golden["max_latency_sec"])])
