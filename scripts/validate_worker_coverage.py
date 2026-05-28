from __future__ import annotations

import json
import sys
from pathlib import Path

MIN_TOTAL_COVERAGE = 80.0
MIN_CORE_COVERAGE = 90.0
CORE_TARGETS = {
    "src/core/stats.py",
    "src/core/pii.py",
    "src/core/anomalies.py",
    "src/core/schema.py",
}


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/validate_worker_coverage.py <coverage-json-path>")
        return 2

    report_path = Path(sys.argv[1]).resolve()
    payload = json.loads(report_path.read_text(encoding="utf-8"))
    totals = payload["totals"]
    files = payload["files"]

    total_percent = round(float(totals["percent_covered"]), 2)
    failures: list[str] = []

    if total_percent < MIN_TOTAL_COVERAGE:
        failures.append(
            f"overall worker coverage {total_percent:.2f}% is below {MIN_TOTAL_COVERAGE:.2f}%"
        )

    print(f"Worker coverage total: {total_percent:.2f}%")

    for relative_path in sorted(CORE_TARGETS):
        coverage_key = relative_path.replace("/", "\\")
        file_payload = files.get(coverage_key)
        if not file_payload:
            failures.append(f"missing coverage entry for {relative_path}")
            continue
        file_percent = round(float(file_payload["summary"]["percent_covered"]), 2)
        print(f"{relative_path}: {file_percent:.2f}%")
        if file_percent < MIN_CORE_COVERAGE:
            failures.append(
                f"{relative_path} coverage {file_percent:.2f}% is below {MIN_CORE_COVERAGE:.2f}%"
            )

    if failures:
        print("Coverage validation failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Coverage validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
