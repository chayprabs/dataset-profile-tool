from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    max_upload_mb: int = int(os.environ.get("DATAPROFILE_MAX_UPLOAD_MB", "50"))
    job_ttl_seconds: int = int(os.environ.get("DATAPROFILE_JOB_TTL_SECONDS", "900"))
    job_memory_limit_mb: int = int(os.environ.get("DATAPROFILE_JOB_MEMORY_LIMIT_MB", "4096"))
    job_cpu_limit_seconds: int = int(os.environ.get("DATAPROFILE_JOB_CPU_LIMIT_SECONDS", "120"))
    job_wall_clock_seconds: int = int(os.environ.get("DATAPROFILE_JOB_WALL_CLOCK_SECONDS", "120"))
    job_max_open_files: int = int(os.environ.get("DATAPROFILE_JOB_MAX_OPEN_FILES", "256"))
    temp_root: Path = Path(os.environ.get("DATAPROFILE_TEMP_ROOT", "/tmp/dataprofile"))


settings = Settings()
