from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.stats import detect_format, profile_dataset
from storage.runtime import job_workspace, persist_upload, upload_sha256, uploaded_temp_path

router = APIRouter(tags=["schema"])


@router.post("/v1/schema-infer")
async def schema_infer_endpoint(
    file: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
    format: str | None = Form(default=None),
    sampleSize: int = Form(default=20),
    sampleMode: str = Form(default="head"),
):
    if not file and not url:
        raise HTTPException(status_code=400, detail="Provide a file or URL.")
    if sampleMode not in {"head", "tail", "random"}:
        raise HTTPException(status_code=400, detail="sampleMode must be head, tail, or random.")

    try:
        with job_workspace() as workspace:
            if file:
                source_path = uploaded_temp_path(file)
                filename = file.filename or "upload"
                resolved_format = format or detect_format(Path(filename))
                source_sha256 = None
                if source_path is None:
                    destination = workspace / filename
                    source_path = await persist_upload(file, destination)
                else:
                    source_sha256 = await upload_sha256(file)
                profile = profile_dataset(
                    source_path,
                    resolved_format,
                    sampleSize,
                    sampleMode,
                    source_sha256=source_sha256,
                )
            else:
                profile = profile_dataset(url or "", format, sampleSize, sampleMode)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return profile.schemaDocument
