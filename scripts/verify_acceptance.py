from __future__ import annotations

import json
from pathlib import Path
from subprocess import run
import shutil
import sys
import time

REPO_ROOT = Path(__file__).resolve().parents[1]
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"
SAMPLES_DIR = REPO_ROOT / "apps" / "web" / "public" / "samples"

if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

from core.drift import diff_profiles  # noqa: E402
from core.stats import profile_dataset  # noqa: E402


SAMPLE_THRESHOLDS_SECONDS = {
    "anomaly-lab.csv": 5.0,
    "chinook.sqlite": 5.0,
    "drift-week-1.csv": 5.0,
    "drift-week-2.csv": 5.0,
    "ecommerce-events.csv": 5.0,
    "mixed-types.csv": 5.0,
    "nyc-taxi-sample.parquet": 20.0,
    "pii-laden.csv": 5.0,
    "sample.arrow": 5.0,
    "users.avro": 5.0,
    "users.json": 5.0,
    "weather.jsonl": 5.0,
    "weather.tsv": 5.0,
}


def verify_sample_latency() -> dict[str, object]:
    results: list[dict[str, object]] = []
    failures: list[str] = []
    for sample_name, threshold in SAMPLE_THRESHOLDS_SECONDS.items():
        started = time.perf_counter()
        profile = profile_dataset(SAMPLES_DIR / sample_name)
        elapsed = time.perf_counter() - started
        passed = elapsed <= threshold and len(profile.columns) > 0
        if not passed:
            failures.append(sample_name)
        results.append(
            {
                "sample": sample_name,
                "seconds": round(elapsed, 4),
                "thresholdSeconds": threshold,
                "rowCount": profile.source.rowCount,
                "status": "pass" if passed else "fail",
            }
        )
    return {
        "status": "pass" if not failures else "fail",
        "results": results,
        "failures": failures,
    }


def verify_schema_roundtrip() -> dict[str, object]:
    pnpm = shutil.which("pnpm.cmd") or shutil.which("pnpm")
    if pnpm is None:
        return {
            "status": "fail",
            "command": "pnpm --dir apps/web exec vitest run app/schema-roundtrip.test.ts",
            "stdout": [],
            "stderr": ["pnpm executable not found on PATH"],
        }
    completed = run(
        [pnpm, "--dir", "apps/web", "exec", "vitest", "run", "app/schema-roundtrip.test.ts"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    return {
        "status": "pass" if completed.returncode == 0 else "fail",
        "command": "pnpm --dir apps/web exec vitest run app/schema-roundtrip.test.ts",
        "stdout": completed.stdout.strip().splitlines()[-6:],
        "stderr": completed.stderr.strip().splitlines()[-6:],
    }


def verify_drift_golden() -> dict[str, object]:
    before = profile_dataset(SAMPLES_DIR / "drift-week-1.csv")
    after = profile_dataset(SAMPLES_DIR / "drift-week-2.csv")
    drift = diff_profiles(before, after)

    expected = {
        "added": ["loyalty_points"],
        "rangeColumns": ["spend"],
        "cardinalityColumns": ["tier"],
    }
    observed = {
        "added": drift.added,
        "rangeColumns": [change.column for change in drift.rangeChanges],
        "cardinalityColumns": [change.column for change in drift.cardinalityChanges],
    }
    passed = observed == expected
    return {
        "status": "pass" if passed else "fail",
        "expected": expected,
        "observed": observed,
    }


def main() -> int:
    latency = verify_sample_latency()
    schema_roundtrip = verify_schema_roundtrip()
    drift_golden = verify_drift_golden()
    payload = {
        "A1": latency,
        "A2": schema_roundtrip,
        "A3": drift_golden,
    }
    print(json.dumps(payload, indent=2))
    return 0 if all(section["status"] == "pass" for section in payload.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
