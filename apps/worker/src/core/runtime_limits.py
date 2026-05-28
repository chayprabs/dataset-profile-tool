from __future__ import annotations

from typing import Any

from settings import settings

try:
    import resource
except ImportError:  # pragma: no cover - unavailable on Windows
    resource = None  # type: ignore[assignment]


def apply_runtime_limits() -> dict[str, Any]:
    result: dict[str, Any] = {
        "configured": {
            "memoryMb": settings.job_memory_limit_mb,
            "cpuSeconds": settings.job_cpu_limit_seconds,
            "wallClockSeconds": settings.job_wall_clock_seconds,
            "maxOpenFiles": settings.job_max_open_files,
        },
        "applied": [],
        "warnings": [],
    }

    if resource is None:
        result["warnings"].append("resource module unavailable; process-level OS limits were not applied.")
        return result

    _apply_limit(resource.RLIMIT_AS, settings.job_memory_limit_mb * 1024 * 1024, "memoryMb", result)
    _apply_limit(resource.RLIMIT_CPU, settings.job_cpu_limit_seconds, "cpuSeconds", result)
    _apply_limit(resource.RLIMIT_NOFILE, settings.job_max_open_files, "maxOpenFiles", result)
    return result


def runtime_limit_snapshot() -> dict[str, Any]:
    return {
        "maxUploadMb": settings.max_upload_mb,
        "jobTtlSeconds": settings.job_ttl_seconds,
        "jobMemoryLimitMb": settings.job_memory_limit_mb,
        "jobCpuLimitSeconds": settings.job_cpu_limit_seconds,
        "jobWallClockSeconds": settings.job_wall_clock_seconds,
        "jobMaxOpenFiles": settings.job_max_open_files,
        "tempRoot": str(settings.temp_root),
    }


def _apply_limit(limit_name: int, soft_limit: int, label: str, result: dict[str, Any]) -> None:
    try:
        current_soft, current_hard = resource.getrlimit(limit_name)
        target_hard = current_hard
        if current_hard not in (-1, resource.RLIM_INFINITY):
            target_hard = max(current_hard, soft_limit)
        resource.setrlimit(limit_name, (soft_limit, target_hard))
        result["applied"].append(label)
    except (OSError, ValueError) as error:
        result["warnings"].append(f"could not apply {label}: {error}")
