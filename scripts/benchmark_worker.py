from __future__ import annotations

import argparse
import ctypes
import json
import math
import statistics
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import pyarrow as pa
import pyarrow.parquet as pq
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parents[1]
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"

if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

from main import app  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Benchmark DataProfile worker routes.")
    parser.add_argument(
        "scenario",
        choices=["profile-csv", "profile-parquet", "drift-csv", "memory-soak-csv"],
    )
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--target-mb", type=int, default=25)
    parser.add_argument("--iterations", type=int, default=10)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="dataprofile-bench-") as temp_dir:
        working_dir = Path(temp_dir)
        client = TestClient(app)

        if args.scenario == "profile-csv":
            source_path = build_csv_fixture(working_dir / "profile.csv", args.target_mb)
            timings = run_profile_benchmark(client, source_path, args.repeats)
            payload = {
                "scenario": args.scenario,
                "targetMb": args.target_mb,
                "actualMb": round(source_path.stat().st_size / (1024 * 1024), 2),
                **summarize_timings(timings),
            }
        elif args.scenario == "profile-parquet":
            source_path = build_parquet_fixture(working_dir / "profile.parquet", args.target_mb)
            timings = run_profile_benchmark(client, source_path, args.repeats)
            payload = {
                "scenario": args.scenario,
                "targetMb": args.target_mb,
                "actualMb": round(source_path.stat().st_size / (1024 * 1024), 2),
                **summarize_timings(timings),
            }
        elif args.scenario == "drift-csv":
            before_path = build_csv_fixture(working_dir / "before.csv", args.target_mb, extra_variant=False)
            after_path = build_csv_fixture(working_dir / "after.csv", args.target_mb, extra_variant=True)
            timings = run_drift_benchmark(client, before_path, after_path, args.repeats)
            payload = {
                "scenario": args.scenario,
                "targetMb": args.target_mb,
                "actualMbBefore": round(before_path.stat().st_size / (1024 * 1024), 2),
                "actualMbAfter": round(after_path.stat().st_size / (1024 * 1024), 2),
                **summarize_timings(timings),
            }
        else:
            source_path = build_csv_fixture(working_dir / "soak.csv", args.target_mb)
            payload = run_memory_soak(client, source_path, args.iterations)

        print(json.dumps(payload, indent=2))
        return 0


def build_csv_fixture(path: Path, target_mb: int, extra_variant: bool = False) -> Path:
    target_bytes = target_mb * 1024 * 1024
    header = "customer_id,email,signup_ts,spend,tier,active,region,notes\n"
    base_tiers = ["bronze", "silver", "gold", "platinum"]
    extra_tiers = ["diamond", "enterprise"] if extra_variant else []
    lorem = "warehouse-ready-customer-profile-with-repeatable-padding"

    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(header)
        row_index = 0
        while handle.tell() < target_bytes:
            tiers = base_tiers + extra_tiers
            tier = tiers[row_index % len(tiers)]
            region = ["apac", "emea", "na", "latam"][row_index % 4]
            spend = 25.5 + (row_index % 500)
            active = "true" if row_index % 2 == 0 else "false"
            if extra_variant:
                spend += 12.5
            handle.write(
                f"{100000 + row_index},user{row_index}@example.com,2026-01-01T12:00:{row_index % 60:02d}Z,"
                f"{spend:.2f},{tier},{active},{region},{lorem}-{row_index % 1000}\n"
            )
            row_index += 1
    return path


def build_parquet_fixture(path: Path, target_mb: int) -> Path:
    target_bytes = target_mb * 1024 * 1024
    writer: pq.ParquetWriter | None = None
    row_index = 0
    batch_size = 25_000
    try:
        while path.stat().st_size < target_bytes if path.exists() else True:
            batch = make_parquet_batch(row_index, batch_size)
            table = pa.Table.from_batches([batch])
            if writer is None:
                writer = pq.ParquetWriter(path, table.schema, compression="NONE")
            writer.write_table(table)
            row_index += batch_size
            if path.exists() and path.stat().st_size >= target_bytes:
                break
    finally:
        if writer is not None:
            writer.close()
    return path


def make_parquet_batch(start: int, size: int) -> pa.RecordBatch:
    indices = list(range(start, start + size))
    return pa.record_batch(
        [
            pa.array(indices),
            pa.array([f"user{index}@example.com" for index in indices]),
            pa.array([f"2026-01-01T12:00:{index % 60:02d}Z" for index in indices]),
            pa.array([float(25 + (index % 500)) for index in indices]),
            pa.array([["bronze", "silver", "gold", "platinum"][index % 4] for index in indices]),
            pa.array([index % 2 == 0 for index in indices]),
            pa.array([["apac", "emea", "na", "latam"][index % 4] for index in indices]),
            pa.array([f"batch-payload-{index % 1000}-" + ("x" * 48) for index in indices]),
        ],
        names=["customer_id", "email", "signup_ts", "spend", "tier", "active", "region", "notes"],
    )


def run_profile_benchmark(client: TestClient, source_path: Path, repeats: int) -> list[float]:
    timings: list[float] = []
    for _ in range(repeats):
        with source_path.open("rb") as handle:
            started = time.perf_counter()
            response = client.post(
                "/v1/profile",
                files={"file": (source_path.name, handle, "application/octet-stream")},
            )
        response.raise_for_status()
        timings.append(time.perf_counter() - started)
    return timings


def run_drift_benchmark(client: TestClient, before_path: Path, after_path: Path, repeats: int) -> list[float]:
    timings: list[float] = []
    for _ in range(repeats):
        with before_path.open("rb") as before_handle, after_path.open("rb") as after_handle:
            started = time.perf_counter()
            response = client.post(
                "/v1/drift",
                files={
                    "before_file": (before_path.name, before_handle, "application/octet-stream"),
                    "after_file": (after_path.name, after_handle, "application/octet-stream"),
                },
            )
        response.raise_for_status()
        timings.append(time.perf_counter() - started)
    return timings


def run_memory_soak(client: TestClient, source_path: Path, iterations: int) -> dict[str, Any]:
    rss_before = get_process_rss_mb()
    timings = run_profile_benchmark(client, source_path, iterations)
    rss_after = get_process_rss_mb()
    return {
        "scenario": "memory-soak-csv",
        "iterations": iterations,
        "targetMb": round(source_path.stat().st_size / (1024 * 1024), 2),
        "rssBeforeMb": rss_before,
        "rssAfterMb": rss_after,
        "rssDeltaMb": round(rss_after - rss_before, 2) if rss_before is not None and rss_after is not None else None,
        **summarize_timings(timings),
    }


def summarize_timings(timings: list[float]) -> dict[str, Any]:
    ordered = sorted(timings)
    return {
        "runs": len(timings),
        "seconds": [round(value, 4) for value in timings],
        "meanSeconds": round(statistics.fmean(timings), 4),
        "p50Seconds": round(percentile(ordered, 0.50), 4),
        "p95Seconds": round(percentile(ordered, 0.95), 4),
    }


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    position = ratio * (len(values) - 1)
    lower_index = math.floor(position)
    upper_index = math.ceil(position)
    if lower_index == upper_index:
        return values[lower_index]
    lower_value = values[lower_index]
    upper_value = values[upper_index]
    return lower_value + (upper_value - lower_value) * (position - lower_index)


def get_process_rss_mb() -> float | None:
    if sys.platform == "win32":
        counters = PROCESS_MEMORY_COUNTERS()
        counters.cb = ctypes.sizeof(PROCESS_MEMORY_COUNTERS)
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        kernel32.GetCurrentProcess.restype = ctypes.c_void_p
        psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
        psapi.GetProcessMemoryInfo.restype = ctypes.c_int
        handle = kernel32.GetCurrentProcess()
        success = psapi.GetProcessMemoryInfo(
            handle,
            ctypes.byref(counters),
            counters.cb,
        )
        if not success:
            return None
        return round(counters.WorkingSetSize / (1024 * 1024), 2)

    try:
        import resource
    except ImportError:
        return None

    usage = resource.getrusage(resource.RUSAGE_SELF)
    rss_kb = getattr(usage, "ru_maxrss", 0)
    if sys.platform == "darwin":
        return round(rss_kb / (1024 * 1024), 2)
    return round(rss_kb / 1024, 2)


class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
    _fields_ = [
        ("cb", ctypes.c_ulong),
        ("PageFaultCount", ctypes.c_ulong),
        ("PeakWorkingSetSize", ctypes.c_size_t),
        ("WorkingSetSize", ctypes.c_size_t),
        ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
        ("QuotaPagedPoolUsage", ctypes.c_size_t),
        ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
        ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
        ("PagefileUsage", ctypes.c_size_t),
        ("PeakPagefileUsage", ctypes.c_size_t),
    ]


if __name__ == "__main__":
    raise SystemExit(main())
