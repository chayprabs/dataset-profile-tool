from __future__ import annotations

import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path

from settings import settings


@contextmanager
def job_workspace():
    settings.temp_root.mkdir(parents=True, exist_ok=True)
    workspace = Path(tempfile.mkdtemp(prefix="job-", dir=settings.temp_root))
    try:
        yield workspace
    finally:
        shutil.rmtree(workspace, ignore_errors=True)
