from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.stats import prepare_url_source, profile_dataset
from storage.runtime import job_workspace

router = APIRouter(tags=["profile"])


@router.post("/v1/profile")
async def profile_endpoint(
    file: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
    format: str | None = Form(default=None),
    sampleSize: int = Form(default=20),
):
    if not file and not url:
        raise HTTPException(status_code=400, detail="Provide a file or URL.")

    try:
        with job_workspace() as workspace:
            if file:
                destination = workspace / (file.filename or "upload")
                destination.write_bytes(await file.read())
                response = profile_dataset(destination, format, sampleSize)
            else:
                prepared = prepare_url_source(url or "", workspace, format)
                response = profile_dataset(prepared.path, prepared.format, sampleSize)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return response
