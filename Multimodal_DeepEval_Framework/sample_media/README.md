# Sample media (placeholders)

`sample_question_1.wav` / `sample_question_2.wav` are **silent 1-second
placeholder clips** — they exist only so the project's file paths resolve
and `run_all.py` runs end-to-end without extra setup.

**Replace them with real recorded speech** (any WAV/MP3, a few seconds,
you speaking the `expected_transcript` from
`framework/datasets/voice_goldens.py`) before trusting the voice test
results — Whisper will transcribe silence as an empty string, which will
correctly fail the WER check, not "pass by accident."

`sample_clip_1.mp4` is NOT included (binary video isn't practical to embed
here). Add your own short clip and update `framework/datasets/video_goldens.py`
with a matching path, question, and `expected_visual_facts`.
