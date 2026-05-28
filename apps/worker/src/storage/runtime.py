from __future__ import annotations

import shutil
import tempfile
from contextlib import contextmanager
import hashlib
from pathlib import Path

from fastapi import UploadFile

from settings import settings

UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024


@contextmanager
def job_workspace():
    settings.temp_root.mkdir(parents=True, exist_ok=True)
    workspace = Path(tempfile.mkdtemp(prefix="job-", dir=settings.temp_root))
    try:
        yield workspace
    finally:
        shutil.rmtree(workspace, ignore_errors=True)


async def persist_upload(upload: UploadFile, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    await upload.seek(0)
    with destination.open("wb") as handle:
        while True:
            chunk = await upload.read(UPLOAD_CHUNK_SIZE)
            if not chunk:
                break
            handle.write(chunk)
    await upload.seek(0)
    return destination


def uploaded_temp_path(upload: UploadFile) -> Path | None:
    for candidate in (getattr(upload.file, "name", None), getattr(getattr(upload.file, "_file", None), "name", None)):
        if not candidate or not isinstance(candidate, str):
            continue
        path = Path(candidate)
        if path.exists():
            return path
    return None


async def upload_sha256(upload: UploadFile) -> str:
    digest = hashlib.sha256()
    await upload.seek(0)
    while True:
        chunk = await upload.read(UPLOAD_CHUNK_SIZE)
        if not chunk:
            break
        digest.update(chunk)
    await upload.seek(0)
    return digest.hexdigest()
