"""Video modality: is the reply relevant to the question asked about the
video, independent of visual grounding?"""
import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

from datasets.video_goldens import VIDEO_GOLDENS


@pytest.mark.video
@pytest.mark.quality
@pytest.mark.parametrize("golden", VIDEO_GOLDENS)
def test_video_answer_relevancy(golden, video_client, judge):
    reply = video_client.send(golden["video_path"], golden["question"])
    tc = LLMTestCase(input=golden["question"], actual_output=reply.reply)
    assert_test(tc, [AnswerRelevancyMetric(threshold=0.6, model=judge)])
