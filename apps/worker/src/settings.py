from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    max_upload_mb: int = int(os.environ.get("DATAPROFILE_MAX_UPLOAD_MB", "50"))
    job_ttl_seconds: int = int(os.environ.get("DATAPROFILE_JOB_TTL_SECONDS", "900"))
    temp_root: Path = Path(os.environ.get("DATAPROFILE_TEMP_ROOT", "/tmp/dataprofile"))


settings = Settings()
