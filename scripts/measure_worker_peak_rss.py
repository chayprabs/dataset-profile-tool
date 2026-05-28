from __future__ import annotations

import argparse
import ctypes
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

REPO_ROOT = Path(__file__).resolve().parents[1]
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"
SCRIPTS_DIR = REPO_ROOT / "scripts"

for path in (WORKER_SRC, SCRIPTS_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from benchmark_worker import build_csv_fixture, build_parquet_fixture  # noqa: E402

RSS_SAMPLE_INTERVAL_SECONDS = 0.2
WORKER_HOST = "127.0.0.1"


def main() -> int:
    parser = argparse.ArgumentParser(description="Measure peak RSS of an external worker process.")
    parser.add_argument("scenario", choices=["profile-csv", "profile-parquet", "drift-csv"])
    parser.add_argument("--target-mb", type=int, default=100)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="dataprofile-worker-rss-") as temp_dir:
        working_dir = Path(temp_dir)
        if args.scenario == "profile-csv":
            source_path = build_csv_fixture(working_dir / "profile.csv", args.target_mb)
            payload_factory = lambda port: send_request(port, lambda client: post_profile(client, source_path))
            fixture_meta = {
                "actualMb": round(source_path.stat().st_size / (1024 * 1024), 2),
            }
        elif args.scenario == "profile-parquet":
            source_path = build_parquet_fixture(working_dir / "profile.parquet", args.target_mb)
            payload_factory = lambda port: send_request(port, lambda client: post_profile(client, source_path))
            fixture_meta = {
                "actualMb": round(source_path.stat().st_size / (1024 * 1024), 2),
            }
        else:
            before_path = build_csv_fixture(working_dir / "before.csv", args.target_mb, extra_variant=False)
            after_path = build_csv_fixture(working_dir / "after.csv", args.target_mb, extra_variant=True)
            payload_factory = lambda port: send_request(port, lambda client: post_drift(client, before_path, after_path))
            fixture_meta = {
                "actualMbBefore": round(before_path.stat().st_size / (1024 * 1024), 2),
                "actualMbAfter": round(after_path.stat().st_size / (1024 * 1024), 2),
            }

        port = pick_open_port()
        with worker_process(port) as process:
            wait_for_health(port)
            rss_before = get_process_rss_mb(process.pid)
            elapsed, peak_rss_mb, response = measure_request(
                process.pid,
                lambda: payload_factory(port),
            )
            rss_after = get_process_rss_mb(process.pid)
            response.raise_for_status()

        payload = {
            "scenario": args.scenario,
            "targetMb": args.target_mb,
            **fixture_meta,
            "seconds": round(elapsed, 4),
            "peakRssMb": peak_rss_mb,
            "rssBeforeMb": rss_before,
            "rssAfterMb": rss_after,
            "rssDeltaMb": round(rss_after - rss_before, 2) if rss_before is not None and rss_after is not None else None,
        }
        print(json.dumps(payload, indent=2))
    return 0


def post_profile(client: httpx.Client, source_path: Path) -> httpx.Response:
    with source_path.open("rb") as handle:
        return client.post(
            "/v1/profile",
            files={"file": (source_path.name, handle, "application/octet-stream")},
        )


def post_drift(client: httpx.Client, before_path: Path, after_path: Path) -> httpx.Response:
    with before_path.open("rb") as before_handle, after_path.open("rb") as after_handle:
        return client.post(
            "/v1/drift",
            files={
                "before_file": (before_path.name, before_handle, "application/octet-stream"),
                "after_file": (after_path.name, after_handle, "application/octet-stream"),
            },
        )


def send_request(port: int, request_factory) -> httpx.Response:
    with httpx.Client(base_url=f"http://{WORKER_HOST}:{port}", timeout=None) as client:
        return request_factory(client)


def pick_open_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((WORKER_HOST, 0))
        return sock.getsockname()[1]


@dataclass
class PeakRssHolder:
    peak_rss_mb: float | None = None

    def observe(self, rss_mb: float | None) -> None:
        if rss_mb is None:
            return
        if self.peak_rss_mb is None or rss_mb > self.peak_rss_mb:
            self.peak_rss_mb = rss_mb


def sample_rss_peak(pid: int, stop_event: threading.Event, peak_holder: PeakRssHolder) -> None:
    while not stop_event.is_set():
        peak_holder.observe(get_process_rss_mb(pid))
        stop_event.wait(RSS_SAMPLE_INTERVAL_SECONDS)
    peak_holder.observe(get_process_rss_mb(pid))


def measure_request(pid: int, request_factory) -> tuple[float, float | None, httpx.Response]:
    stop_event = threading.Event()
    peak_holder = PeakRssHolder()
    sampler = threading.Thread(target=sample_rss_peak, args=(pid, stop_event, peak_holder), daemon=True)
    sampler.start()
    started = time.perf_counter()
    response = None
    try:
        response = request_factory()
    finally:
        elapsed = time.perf_counter() - started
        stop_event.set()
        sampler.join(timeout=1.0)
    return elapsed, peak_holder.peak_rss_mb, response


def worker_process(port: int):
    env = os.environ.copy()
    env["PYTHONPATH"] = str(WORKER_SRC)
    command = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        WORKER_HOST,
        "--port",
        str(port),
    ]
    process = subprocess.Popen(
        command,
        cwd=WORKER_SRC,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return ManagedProcess(process)


class ManagedProcess:
    def __init__(self, process: subprocess.Popen):
        self.process = process

    def __enter__(self) -> subprocess.Popen:
        return self.process

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=10)


def wait_for_health(port: int, timeout_seconds: float = 30.0) -> None:
    deadline = time.time() + timeout_seconds
    with httpx.Client(base_url=f"http://{WORKER_HOST}:{port}", timeout=2.0) as client:
        while time.time() < deadline:
            try:
                response = client.get("/v1/health")
                if response.status_code == 200:
                    return
            except httpx.HTTPError:
                pass
            time.sleep(0.25)
    raise TimeoutError("Worker did not become healthy in time.")


def get_process_rss_mb(pid: int) -> float | None:
    if sys.platform == "win32":
        return get_process_rss_mb_windows(pid)
    return None


def get_process_rss_mb_windows(pid: int) -> float | None:
    process_query_limited_information = 0x1000
    process_vm_read = 0x0010
    handle = ctypes.WinDLL("kernel32", use_last_error=True).OpenProcess(
        process_query_limited_information | process_vm_read,
        False,
        pid,
    )
    if not handle:
        return None
    try:
        counters = PROCESS_MEMORY_COUNTERS()
        counters.cb = ctypes.sizeof(PROCESS_MEMORY_COUNTERS)
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
        psapi.GetProcessMemoryInfo.restype = ctypes.c_int
        success = psapi.GetProcessMemoryInfo(
            handle,
            ctypes.byref(counters),
            counters.cb,
        )
        if not success:
            return None
        return round(counters.WorkingSetSize / (1024 * 1024), 2)
    finally:
        ctypes.WinDLL("kernel32", use_last_error=True).CloseHandle(handle)


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
