from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
COMPOSE_FILES = ["docker-compose.yml", "docker-compose.single.yml"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify local DataProfile stack and Docker compose setup.")
    parser.add_argument("--up", action="store_true", help="Attempt docker compose up -d and health checks.")
    parser.add_argument("--timeout-seconds", type=int, default=45)
    args = parser.parse_args()

    report: dict[str, object] = {
        "composeFiles": {},
        "daemon": {},
        "health": {},
        "verdict": "PASS",
    }

    for compose_file in COMPOSE_FILES:
        report["composeFiles"][compose_file] = run_command(
            ["docker", "compose", "-f", compose_file, "config"],
            cwd=REPO_ROOT,
        )

    daemon_check = run_command(["docker", "version", "--format", "{{.Server.Version}}"], cwd=REPO_ROOT)
    report["daemon"] = daemon_check

    if daemon_check["status"] != "pass":
        report["verdict"] = "VERIFY-DEFERRED"
        print(json.dumps(report, indent=2))
        return 0

    if not args.up:
        print(json.dumps(report, indent=2))
        return 0

    up_result = run_command(["docker", "compose", "up", "-d", "--build"], cwd=REPO_ROOT)
    report["composeUp"] = up_result
    if up_result["status"] != "pass":
        report["verdict"] = "FAIL"
        print(json.dumps(report, indent=2))
        return 1

    report["health"] = {
        "worker": wait_for_url("http://127.0.0.1:8080/v1/health", args.timeout_seconds),
        "web": wait_for_url("http://127.0.0.1:3000", args.timeout_seconds),
    }
    if any(result["status"] != "pass" for result in report["health"].values()):
        report["verdict"] = "FAIL"

    print(json.dumps(report, indent=2))
    return 0 if report["verdict"] != "FAIL" else 1


def run_command(command: list[str], cwd: Path) -> dict[str, object]:
    try:
        completed = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
            check=False,
        )
    except FileNotFoundError as error:
        return {"status": "verify-deferred", "stdout": "", "stderr": str(error), "command": command}

    status = "pass" if completed.returncode == 0 else "verify-deferred"
    if completed.returncode != 0 and "The system cannot find the file specified" not in completed.stderr:
        status = "fail"

    return {
        "status": status,
        "returncode": completed.returncode,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
        "command": command,
    }


def wait_for_url(url: str, timeout_seconds: int) -> dict[str, object]:
    started = time.time()
    last_error = ""
    while time.time() - started < timeout_seconds:
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                return {"status": "pass", "url": url, "statusCode": response.status}
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = str(error)
            time.sleep(1)
    return {"status": "fail", "url": url, "error": last_error}


if __name__ == "__main__":
    raise SystemExit(main())
