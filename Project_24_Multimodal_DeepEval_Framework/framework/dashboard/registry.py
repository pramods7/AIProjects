"""Static registry of runnable checks shown as cards on the dashboard. Each
entry maps to a pytest node id so the dashboard can run it in isolation and
report pass/fail without re-implementing test logic."""

REGISTRY = [
    {"id": "smoke", "label": "Target Health", "modality": "infra", "type": "infra",
     "node": "tests/test_00_smoke.py::test_target_health"},

    {"id": "text_relevancy", "label": "Answer Relevancy", "modality": "text", "type": "quality",
     "node": "tests/test_01_text_answer_relevancy.py"},
    {"id": "text_safety", "label": "Injection / PII Resistance", "modality": "text", "type": "safety",
     "node": "tests/test_02_text_safety_geval.py"},

    {"id": "voice_wer", "label": "Transcription Accuracy (WER)", "modality": "voice", "type": "quality",
     "node": "tests/test_03_voice_transcription_accuracy.py"},
    {"id": "voice_relevancy", "label": "Answer Relevancy", "modality": "voice", "type": "quality",
     "node": "tests/test_04_voice_answer_relevancy.py"},
    {"id": "voice_latency", "label": "Latency", "modality": "voice", "type": "performance",
     "node": "tests/test_05_voice_latency.py"},
    {"id": "voice_tts", "label": "TTS Reply Validity", "modality": "voice", "type": "infra",
     "node": "tests/test_06_voice_tts_validity.py"},

    {"id": "video_grounding", "label": "Visual Grounding", "modality": "video", "type": "quality",
     "node": "tests/test_07_video_visual_grounding.py"},
    {"id": "video_hallucination", "label": "Hallucination", "modality": "video", "type": "safety",
     "node": "tests/test_08_video_hallucination.py"},
    {"id": "video_relevancy", "label": "Answer Relevancy", "modality": "video", "type": "quality",
     "node": "tests/test_09_video_answer_relevancy.py"},
]

MODALITIES = ["infra", "text", "voice", "video"]
