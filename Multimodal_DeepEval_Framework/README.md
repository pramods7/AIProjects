# Multimodal DeepEval Framework (Text + Voice + Video)

A comprehensive evaluation framework to test and benchmark a **live
chatbot's text, voice, AND video** capabilities — either the bundled demo
chatbot, or **your own live chatbot**, via a config file (no code changes).

```
Multimodal_DeepEval_Framework/
├── demo_chatbot/        Subsystem D — a real multimodal app under test
│   ├── app.py             FastAPI: /chat/text, /chat/voice, /chat/video
│   ├── llm.py / stt.py / tts.py / vision.py
│   └── frontend/index.html  manual browser UI (mic + video upload)
│
├── framework/            Subsystem E — the generic multimodal test framework
│   ├── targets_config.yaml   <-- POINT THIS AT ANY CHATBOT (yours or the demo)
│   ├── config.py              loads targets_config.yaml
│   ├── targets/
│   │   ├── generic_text_client.py
│   │   ├── generic_voice_client.py   native OR pipeline (STT/TTS) mode
│   │   └── generic_video_client.py   native OR pipeline (frame+vision) mode
│   ├── stt_provider.py / tts_provider.py / vision_provider.py   (pipeline mode only)
│   ├── llm_providers/          swappable DeepEval judge (OpenAI/Groq/Ollama)
│   ├── datasets/                goldens for text / voice / video
│   ├── metrics/                 custom WER + latency metrics, video G-Evals
│   ├── tests/                   10 pytest files across 3 modalities
│   ├── dashboard/                live web dashboard (run cards + manual tester)
│   ├── run_all.py
│   └── conftest.py
│
└── sample_media/          placeholder audio; see its README before real runs
```

## The key idea: "native" vs "pipeline" per modality

Every chatbot is different, so each modality in `targets_config.yaml` has a
`mode`:

- **`native`** — your chatbot already accepts audio/video directly (like the
  bundled demo). The framework just uploads the file and reads back the
  reply fields you name in the config.
- **`pipeline`** — your chatbot only has a text API. The framework does
  STT (for voice) or frame-extraction + vision-model description (for
  video) itself, then calls your text endpoint with that content — so you
  can still get voice/video metrics on a text-only bot.

This is what makes the framework "generic": point `base_url` +
field-name mappings at **any** live chatbot, choose `native` or `pipeline`
per modality, and every test/metric below works unmodified.

## What it tests (10 checks across 3 modalities)

| # | Check | Modality | Type |
|---|-------|----------|------|
| 0 | Target health | infra | infra |
| 1 | Answer Relevancy | text | quality |
| 2 | Injection / PII-leak resistance (G-Eval) | text | safety |
| 3 | Transcription Accuracy (WER) | voice | quality |
| 4 | Answer Relevancy (post-STT) | voice | quality |
| 5 | End-to-end Latency | voice | performance |
| 6 | TTS reply validity | voice | infra |
| 7 | Visual Grounding (G-Eval) | video | quality |
| 8 | Hallucination (G-Eval) | video | safety |
| 9 | Answer Relevancy | video | quality |

## One-shot setup

```bash
cd Project_24_Multimodal_DeepEval_Framework
python -m venv .venv && source .venv/bin/activate   # or use uv
pip install -r requirements.txt

cp .env.example .env
# edit .env: OPENAI_API_KEY (required for demo chatbot + judge by default),
# optionally GROQ_API_KEY if you set CHAT_PROVIDER/STT_PROVIDER/JUDGE_PROVIDER=groq
export $(grep -v '^#' .env | xargs)   # or use python-dotenv, already wired into the apps
```

## Option A — test the bundled demo chatbot

```bash
# Terminal 1 — demo chatbot backend (text + voice + video)
cd demo_chatbot && uvicorn app:app --reload --port 8301

# Terminal 2 — open demo_chatbot/frontend/index.html in a browser to try it manually

# Terminal 3 — run the test suite (targets_config.yaml already points at :8301)
cd framework
python run_all.py
open reports/report.html

# Or use the live dashboard
uvicorn dashboard.app:app --port 8303
open http://localhost:8303
```

## Option B — test YOUR OWN live chatbot

1. Copy `framework/targets_config.yaml` to e.g. `my_bot_config.yaml`.
2. Fill in `base_url` and the field names your API actually uses for each
   modality you want tested (see the commented example block at the bottom
   of the file for a text-only bot using `pipeline` mode for voice/video).
3. Point the framework at it:
   ```bash
   export TARGET_CONFIG=../my_bot_config.yaml
   python run_all.py
   ```
   or pass `--target-config` to `run_all.py`, or set `TARGET_CONFIG` before
   launching the dashboard.

No code changes needed — the generic clients read everything from the
config file.

## Filtering runs

```bash
python run_all.py --only voice                 # just voice modality
python run_all.py --only "video and safety"     # just video hallucination check
python run_all.py --keyword transcription       # just the WER test
python run_all.py --provider groq --judge-model openai/gpt-oss-120b
```

## Honest limitations (read before trusting results)

- **Sample audio is a silent placeholder.** Replace `sample_media/*.wav`
  with real recorded speech, or the transcription/relevancy tests are
  meaningless (Whisper will correctly return an empty transcript for
  silence, so those tests will correctly *fail*, not falsely pass).
- **No sample video is bundled** (binary, and content-specific to your
  product). Add your own clip + update `framework/datasets/video_goldens.py`.
- **DeepEval has no native audio/video metric.** Voice quality is scored by
  transcribing to text and reusing text metrics (+ a custom WER metric for
  transcription itself). Video quality is scored by extracting frames and
  reusing text metrics against frame-derived context (+ custom G-Evals for
  grounding/hallucination). This is the standard practical approach, but it
  is not literally "does the audio sound natural" or "is the video decoded
  correctly" — those need separate signal-processing tooling out of DeepEval's
  scope.
- **TTS validity check is a size sanity-check, not perceptual audio QA.**
