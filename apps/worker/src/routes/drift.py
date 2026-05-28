from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.drift import diff_profiles
from core.stats import prepare_url_source, profile_dataset
from storage.runtime import job_workspace

router = APIRouter(tags=["drift"])


@router.post("/v1/drift")
async def drift_endpoint(
    before_file: UploadFile | None = File(default=None),
    after_file: UploadFile | None = File(default=None),
    before_url: str | None = Form(default=None),
    after_url: str | None = Form(default=None),
    before_format: str | None = Form(default=None),
    after_format: str | None = Form(default=None),
):
    if not (before_file or before_url) or not (after_file or after_url):
        raise HTTPException(status_code=400, detail="Provide before and after sources.")

    with job_workspace() as workspace:
        if before_file:
            before_path = workspace / (before_file.filename or "before-upload")
            before_path.write_bytes(await before_file.read())
            before_profile = profile_dataset(before_path, before_format, profile_mode="drift")
        else:
            prepared_before = prepare_url_source(before_url or "", workspace / "before", before_format)
            before_profile = profile_dataset(prepared_before.path, prepared_before.format, profile_mode="drift")

        if after_file:
            after_path = workspace / (after_file.filename or "after-upload")
            after_path.write_bytes(await after_file.read())
            after_profile = profile_dataset(after_path, after_format, profile_mode="drift")
        else:
            prepared_after = prepare_url_source(after_url or "", workspace / "after", after_format)
            after_profile = profile_dataset(prepared_after.path, prepared_after.format, profile_mode="drift")

    return diff_profiles(before_profile, after_profile)
