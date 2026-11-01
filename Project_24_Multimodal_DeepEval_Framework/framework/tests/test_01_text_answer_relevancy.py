"""Text modality: answer relevancy against golden Q&A."""
import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

from datasets.text_goldens import TEXT_GOLDENS


@pytest.mark.text
@pytest.mark.quality
@pytest.mark.parametrize("golden", TEXT_GOLDENS)
def test_text_answer_relevancy(golden, text_client, judge):
    reply = text_client.chat(golden["input"])
    tc = LLMTestCase(input=golden["input"], actual_output=reply.reply)
    assert_test(tc, [AnswerRelevancyMetric(threshold=0.6, model=judge)])
