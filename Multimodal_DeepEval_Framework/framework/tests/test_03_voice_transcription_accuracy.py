"""Voice modality: does STT correctly transcribe the spoken question?"""
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase

from datasets.voice_goldens import VOICE_GOLDENS
from metrics.wer_metric import TranscriptionAccuracyMetric


@pytest.mark.voice
@pytest.mark.quality
@pytest.mark.parametrize("golden", VOICE_GOLDENS)
def test_voice_transcription_accuracy(golden, voice_client):
    reply = voice_client.send(golden["audio_path"])
    tc = LLMTestCase(
        input="[voice input]",
        actual_output=reply.transcript,
        expected_output=golden["expected_transcript"],
    )
    assert_test(tc, [TranscriptionAccuracyMetric(threshold=0.25)])
