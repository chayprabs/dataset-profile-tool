from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = REPO_ROOT / "reports" / "lighthouse"
RUNTIME_DIR = REPO_ROOT / ".tmp" / "lighthouse"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Lighthouse against the local DataProfile web app.")
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--port", type=int, default=3000)
    parser.add_argument("--worker-port", type=int, default=8080)
    parser.add_argument("--timeout-seconds", type=int, default=90)
    args = parser.parse_args()

    if not args.skip_build:
        completed = subprocess.run(
            [resolve_command("pnpm"), "--filter", "@dataprofile/web", "build"],
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        if completed.returncode != 0:
            print(completed.stdout)
            print(completed.stderr, file=sys.stderr)
            return completed.returncode

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    report_base = REPORT_DIR / f"home-{timestamp}"
    worker_process = None
    web_process = None
    try:
        worker_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(args.worker_port)],
            cwd=REPO_ROOT / "apps" / "worker" / "src",
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        wait_for_url(f"http://127.0.0.1:{args.worker_port}/v1/health", args.timeout_seconds)

        web_process = subprocess.Popen(
            ["node", "../../node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", str(args.port)],
            cwd=REPO_ROOT / "apps" / "web",
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        wait_for_url(f"http://127.0.0.1:{args.port}", args.timeout_seconds)

        lighthouse_command = [
            resolve_command("pnpm"),
            "exec",
            "lighthouse",
            f"http://127.0.0.1:{args.port}",
            "--preset=desktop",
            "--only-categories=performance,accessibility,best-practices,seo",
            "--quiet",
            "--chrome-flags=--headless=new --no-sandbox",
            "--output=json",
            "--output=html",
            f"--output-path={report_base.as_posix()}",
        ]
        completed = subprocess.run(
            lighthouse_command,
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
            check=False,
            env=lighthouse_env(),
        )
        json_path = report_base.with_suffix(".report.json")
        if not json_path.exists():
            json_path = report_base.with_suffix(".json")
        if completed.returncode != 0 and not json_path.exists():
            print(json.dumps(
                {
                    "verdict": "FAIL",
                    "command": lighthouse_command,
                    "stdout": completed.stdout,
                    "stderr": completed.stderr,
                },
                indent=2,
            ))
            return completed.returncode

        payload = json.loads(json_path.read_text(encoding="utf-8"))
        categories = payload["categories"]
        summary = {
            "verdict": "PASS" if all(category["score"] >= 0.95 for category in categories.values()) else "FAIL",
            "url": payload["finalDisplayedUrl"],
            "scores": {
                name: round(details["score"] * 100, 1) for name, details in categories.items()
            },
            "reportJson": str(json_path),
            "reportHtml": str(report_base.with_suffix(".report.html")),
        }
        if completed.returncode != 0:
            summary["warnings"] = [completed.stderr.strip()]
        print(json.dumps(summary, indent=2))
        return 0 if summary["verdict"] == "PASS" else 1
    finally:
        terminate_process(web_process)
        terminate_process(worker_process)


def wait_for_url(url: str, timeout_seconds: int) -> None:
    started = time.time()
    while time.time() - started < timeout_seconds:
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                if response.status < 500:
                    return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(1)
    raise TimeoutError(f"Timed out waiting for {url}")


def terminate_process(process: subprocess.Popen[str] | None) -> None:
    if process is None:
        return
    if process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


def resolve_command(command: str) -> str:
    if sys.platform == "win32":
        return shutil.which(f"{command}.cmd") or shutil.which(command) or command
    return shutil.which(command) or command


def lighthouse_env() -> dict[str, str]:
    environment = dict(os.environ)
    runtime_path = str(RUNTIME_DIR.resolve())
    environment["TMP"] = runtime_path
    environment["TEMP"] = runtime_path
    environment["TMPDIR"] = runtime_path
    return environment


if __name__ == "__main__":
    raise SystemExit(main())
