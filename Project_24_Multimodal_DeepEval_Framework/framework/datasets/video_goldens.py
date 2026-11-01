"""Golden cases for video-modality evaluation.

Each entry points at a short video clip, a question about it, and the
visual facts the reply should be grounded in (used by the G-Eval visual
grounding metric as expected context, and to check for hallucination).

Replace sample_media/*.mp4 with real clips relevant to your product before
running for real.
"""
import os

_MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "sample_media")

VIDEO_GOLDENS = [
    {
        "video_path": os.path.join(_MEDIA_DIR, "sample_clip_1.mp4"),
        "question": "What's wrong with my headphones based on this video?",
        "expected_visual_facts": [
            "a pair of headphones is shown",
            "the left earcup light is off / not lit",
        ],
    },
]
