"""Runs a single pytest node id and reports pass/fail + captured output."""
from __future__ import annotations
import os
import subprocess
import sys
import time

FRAMEWORK_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_node(node_id: str, provider: str | None = None, judge_model: str | None = None) -> dict:
    env = os.environ.copy()
    if provider:
        env["JUDGE_PROVIDER"] = provider
    if judge_model and provider:
        env[f"JUDGE_MODEL_{provider.upper()}"] = judge_model

    start = time.time()
    proc = subprocess.run(
        [sys.executable, "-m", "pytest", node_id, "-v", "--tb=short", "-p", "no:cacheprovider"],
        cwd=FRAMEWORK_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=300,
    )
    elapsed = time.time() - start
    passed = proc.returncode == 0
    return {
        "passed": passed,
        "returncode": proc.returncode,
        "elapsed_sec": round(elapsed, 2),
        "stdout": proc.stdout[-6000:],
        "stderr": proc.stderr[-3000:],
    }
