#!/usr/bin/env python3
"""One-command runner across text, voice, and video modalities, with an
HTML report, mirroring Project_23's run_all.py but multimodal + generic."""
from __future__ import annotations
import argparse
import os
import subprocess
import sys


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--only", help="pytest -m marker expression, e.g. 'voice and quality'")
    p.add_argument("--keyword", help="pytest -k expression")
    p.add_argument("--provider", help="override JUDGE_PROVIDER")
    p.add_argument("--judge-model", help="override judge model")
    p.add_argument("--target-config", help="override TARGET_CONFIG path")
    args = p.parse_args()

    env = os.environ.copy()
    if args.provider:
        env["JUDGE_PROVIDER"] = args.provider
    if args.judge_model:
        env[f"JUDGE_MODEL_{args.provider.upper()}" if args.provider else "JUDGE_MODEL_OPENAI"] = args.judge_model
    if args.target_config:
        env["TARGET_CONFIG"] = args.target_config

    os.makedirs("reports", exist_ok=True)
    cmd = [sys.executable, "-m", "pytest", "tests/", "--html=reports/report.html", "--self-contained-html", "-v"]
    if args.only:
        cmd += ["-m", args.only]
    if args.keyword:
        cmd += ["-k", args.keyword]

    result = subprocess.run(cmd, env=env)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
