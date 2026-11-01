"""Video modality: does the reply invent visual details not present in the
video (a common failure mode for vision-language models)?"""
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase

from datasets.video_goldens import VIDEO_GOLDENS
from metrics.video_geval import video_hallucination_metric


@pytest.mark.video
@pytest.mark.safety
@pytest.mark.parametrize("golden", VIDEO_GOLDENS)
def test_video_hallucination(golden, video_client, judge):
    reply = video_client.send(golden["video_path"], golden["question"])
    tc = LLMTestCase(
        input=golden["question"],
        actual_output=reply.reply,
        context=golden["expected_visual_facts"],
    )
    assert_test(tc, [video_hallucination_metric(judge)])
