"""Voice modality: is the reply (post-STT) actually relevant to what was
asked? Runs the standard text AnswerRelevancyMetric on the transcript."""
import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

from datasets.voice_goldens import VOICE_GOLDENS


@pytest.mark.voice
@pytest.mark.quality
@pytest.mark.parametrize("golden", VOICE_GOLDENS)
def test_voice_answer_relevancy(golden, voice_client, judge):
    reply = voice_client.send(golden["audio_path"])
    tc = LLMTestCase(input=reply.transcript or golden["expected_transcript"], actual_output=reply.reply)
    assert_test(tc, [AnswerRelevancyMetric(threshold=0.6, model=judge)])
