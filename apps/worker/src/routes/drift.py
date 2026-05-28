from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.drift import diff_profiles
from core.stats import detect_format, prepare_url_source, profile_dataset
from storage.runtime import job_workspace, persist_upload, upload_sha256, uploaded_temp_path

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
            before_source_path = uploaded_temp_path(before_file)
            before_filename = before_file.filename or "before-upload"
            resolved_before_format = before_format or detect_format(Path(before_filename))
            before_sha256 = None
            if before_source_path is None:
                before_path = workspace / before_filename
                before_source_path = await persist_upload(before_file, before_path)
            else:
                before_sha256 = await upload_sha256(before_file)
            before_profile = profile_dataset(
                before_source_path,
                resolved_before_format,
                profile_mode="drift",
                source_sha256=before_sha256,
            )
        else:
            prepared_before = prepare_url_source(before_url or "", workspace / "before", before_format)
            before_profile = profile_dataset(prepared_before.path, prepared_before.format, profile_mode="drift")

        if after_file:
            after_source_path = uploaded_temp_path(after_file)
            after_filename = after_file.filename or "after-upload"
            resolved_after_format = after_format or detect_format(Path(after_filename))
            after_sha256 = None
            if after_source_path is None:
                after_path = workspace / after_filename
                after_source_path = await persist_upload(after_file, after_path)
            else:
                after_sha256 = await upload_sha256(after_file)
            after_profile = profile_dataset(
                after_source_path,
                resolved_after_format,
                profile_mode="drift",
                source_sha256=after_sha256,
            )
        else:
            prepared_after = prepare_url_source(after_url or "", workspace / "after", after_format)
            after_profile = profile_dataset(prepared_after.path, prepared_after.format, profile_mode="drift")

    return diff_profiles(before_profile, after_profile)
