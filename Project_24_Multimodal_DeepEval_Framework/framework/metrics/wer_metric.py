"""Word Error Rate metric for STT transcription accuracy — not part of
DeepEval's built-ins, so we write a small custom BaseMetric."""
from __future__ import annotations
import jiwer
from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase


class TranscriptionAccuracyMetric(BaseMetric):
    """Passes when Word Error Rate between actual and expected transcript is
    below `threshold` (lower WER = better, so this is a ceiling metric)."""

    def __init__(self, threshold: float = 0.25):
        self.threshold = threshold
        self.async_mode = False

    def measure(self, test_case: LLMTestCase) -> float:
        expected = test_case.expected_output or ""
        actual = test_case.actual_output or ""
        self.score = jiwer.wer(expected.lower(), actual.lower()) if expected else 1.0
        self.reason = (
            f"WER={self.score:.3f} (threshold {self.threshold}) — "
            f"expected: {expected!r}, got: {actual!r}"
        )
        self.success = self.score <= self.threshold
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Transcription Accuracy (WER)"
