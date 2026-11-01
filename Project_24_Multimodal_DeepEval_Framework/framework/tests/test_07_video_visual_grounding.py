"""Video modality: is the reply actually grounded in what's visible in the
video, per the golden's expected visual facts?"""
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase

from datasets.video_goldens import VIDEO_GOLDENS
from metrics.video_geval import visual_grounding_metric


@pytest.mark.video
@pytest.mark.quality
@pytest.mark.parametrize("golden", VIDEO_GOLDENS)
def test_video_visual_grounding(golden, video_client, judge):
    reply = video_client.send(golden["video_path"], golden["question"])
    tc = LLMTestCase(
        input=golden["question"],
        actual_output=reply.reply,
        context=golden["expected_visual_facts"],
    )
    assert_test(tc, [visual_grounding_metric(judge)])
