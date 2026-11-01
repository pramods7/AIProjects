"""Simple pass/fail latency metric for voice/video turnaround time."""
from __future__ import annotations
from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase


class LatencyMetric(BaseMetric):
    def __init__(self, max_seconds: float):
        self.max_seconds = max_seconds
        self.async_mode = False

    def measure(self, test_case: LLMTestCase) -> float:
        latency = test_case.completion_time or 0.0
        self.score = latency
        self.success = latency <= self.max_seconds
        self.reason = f"latency={latency:.2f}s (max {self.max_seconds}s)"
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Latency"
