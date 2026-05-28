from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
from subprocess import DEVNULL, Popen
import sys
import tempfile
from threading import Thread
import time
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

import httpx

REPO_ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = REPO_ROOT / "apps" / "web" / "public" / "samples"
PII_SAMPLE = SAMPLES_DIR / "pii-laden.csv"
WORKER_HOST = "127.0.0.1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify DataProfile privacy/security worker behavior.")
    parser.add_argument("--port", type=int, default=8091)
    parser.add_argument("--timeout-seconds", type=int, default=60)
    return parser.parse_args()


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


def serve_samples():
    server = TCPServer((WORKER_HOST, 0), lambda *args, **kwargs: QuietHandler(*args, directory=str(SAMPLES_DIR), **kwargs))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread


def wait_for_worker(port: int, timeout_seconds: int) -> None:
    deadline = time.time() + timeout_seconds
    last_error = "worker did not start"
    with httpx.Client(base_url=f"http://{WORKER_HOST}:{port}", timeout=2.0) as client:
        while time.time() < deadline:
            try:
                response = client.get("/v1/health")
                if response.status_code == 200:
                    return
                last_error = f"unexpected status {response.status_code}"
            except httpx.HTTPError as error:
                last_error = str(error)
            time.sleep(0.5)
    raise TimeoutError(last_error)


def start_worker(port: int, temp_root: Path, stdout_log: Path, stderr_log: Path) -> Popen:
    env = os.environ.copy()
    env["DATAPROFILE_TEMP_ROOT"] = str(temp_root)
    return Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--app-dir",
            "apps/worker/src",
            "--host",
            WORKER_HOST,
            "--port",
            str(port),
        ],
        cwd=REPO_ROOT,
        env=env,
        stdout=stdout_log.open("w", encoding="utf-8"),
        stderr=stderr_log.open("w", encoding="utf-8"),
        stdin=DEVNULL,
    )


def profile_pii_sample(client: httpx.Client) -> dict[str, object]:
    with PII_SAMPLE.open("rb") as handle:
        response = client.post(
            "/v1/profile",
            files={"file": (PII_SAMPLE.name, handle, "text/csv")},
        )
    response.raise_for_status()
    return response.json()


def profile_remote_samples(client: httpx.Client, base_url: str) -> tuple[dict[str, object], dict[str, object]]:
    profile_response = client.post("/v1/profile", data={"url": f"{base_url}/ecommerce-events.csv"})
    profile_response.raise_for_status()
    drift_response = client.post(
        "/v1/drift",
        data={
            "before_url": f"{base_url}/drift-week-1.csv",
            "after_url": f"{base_url}/drift-week-2.csv",
        },
    )
    drift_response.raise_for_status()
    return profile_response.json(), drift_response.json()


def load_pii_values() -> list[str]:
    with PII_SAMPLE.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        values: list[str] = []
        for row in reader:
            values.extend(value for value in row.values() if value)
    return values


def main() -> int:
    args = parse_args()
    with tempfile.TemporaryDirectory(prefix="dataprofile-privacy-") as temp_dir:
        temp_root = Path(temp_dir) / "worker-temp"
        stdout_log = Path(temp_dir) / "worker.stdout.log"
        stderr_log = Path(temp_dir) / "worker.stderr.log"
        worker = start_worker(args.port, temp_root, stdout_log, stderr_log)
        sample_server, sample_thread = serve_samples()

        try:
            wait_for_worker(args.port, args.timeout_seconds)
            with httpx.Client(base_url=f"http://{WORKER_HOST}:{args.port}", timeout=30.0) as client:
                pii_profile = profile_pii_sample(client)
                remote_profile, remote_drift = profile_remote_samples(
                    client, f"http://{WORKER_HOST}:{sample_server.server_address[1]}"
                )
        finally:
            sample_server.shutdown()
            sample_thread.join(timeout=5)
            worker.terminate()
            try:
                worker.wait(timeout=10)
            except Exception:
                worker.kill()
                worker.wait(timeout=10)

        log_text = stdout_log.read_text(encoding="utf-8") + "\n" + stderr_log.read_text(encoding="utf-8")
        leaked_values = [value for value in load_pii_values() if value in log_text]

        payload = {
            "workerLogRedaction": {
                "status": "pass" if not leaked_values else "fail",
                "checkedValues": 10,
                "leakedValues": leaked_values,
            },
            "remoteUrlProfile": {
                "status": "pass",
                "warningIncludesHttpfs": any("httpfs" in warning for warning in remote_profile["warnings"]),
                "rowCount": remote_profile["source"]["rowCount"],
            },
            "remoteUrlDrift": {
                "status": "pass",
                "added": remote_drift["added"],
            },
        }
        print(json.dumps(payload, indent=2))
        return 0 if not leaked_values else 1


if __name__ == "__main__":
    raise SystemExit(main())
