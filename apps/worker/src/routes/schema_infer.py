from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.stats import profile_dataset
from storage.runtime import job_workspace

router = APIRouter(tags=["schema"])


@router.post("/v1/schema-infer")
async def schema_infer_endpoint(
    file: UploadFile | None = File(default=None),
    url: str | None = Form(default=None),
    format: str | None = Form(default=None),
):
    if not file and not url:
        raise HTTPException(status_code=400, detail="Provide a file or URL.")
    with job_workspace() as workspace:
        if file:
            destination = workspace / (file.filename or "upload")
            destination.write_bytes(await file.read())
            profile = profile_dataset(destination, format)
        else:
            profile = profile_dataset(url or "", format)
    return profile.schemaDocument
