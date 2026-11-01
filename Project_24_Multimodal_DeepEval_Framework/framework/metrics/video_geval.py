"""G-Eval templates for video-modality quality checks. G-Eval is DeepEval's
LLM-as-judge metric driven by natural-language criteria, so these are just
pre-built GEval configurations rather than a new BaseMetric class."""
from __future__ import annotations
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams


def visual_grounding_metric(judge) -> GEval:
    return GEval(
        name="Visual Grounding",
        criteria=(
            "Determine whether the 'actual output' accurately reflects and "
            "references the visual facts listed in 'context' (extracted "
            "from the customer's video). Penalize any claim about the "
            "video's contents that is not supported by 'context'."
        ),
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
            LLMTestCaseParams.CONTEXT,
        ],
        model=judge,
        threshold=0.6,
    )


def video_hallucination_metric(judge) -> GEval:
    return GEval(
        name="Video Hallucination",
        criteria=(
            "Check whether 'actual output' invents objects, brands, damage, "
            "or events that are NOT present in 'context' (the ground-truth "
            "visual facts from the video). Score LOW if it hallucinates "
            "anything not grounded in context, HIGH if every visual claim "
            "is supported."
        ),
        evaluation_params=[
            LLMTestCaseParams.ACTUAL_OUTPUT,
            LLMTestCaseParams.CONTEXT,
        ],
        model=judge,
        threshold=0.6,
    )
