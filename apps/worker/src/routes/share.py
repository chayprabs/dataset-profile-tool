from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models import ShareCreateRequest, ShareCreateResponse, ShareFetchResponse
from storage.share_store import share_store

router = APIRouter(tags=["share"])


@router.post("/v1/share", response_model=ShareCreateResponse)
def create_share_link(request: ShareCreateRequest):
    token, artifact = share_store.create(request.kind, request.payload)
    return ShareCreateResponse(
        token=token,
        kind=request.kind,
        expiresAt=artifact.expires_at.isoformat(),
    )


@router.get("/v1/share/{token}", response_model=ShareFetchResponse)
def fetch_share_link(token: str):
    artifact = share_store.get(token)
    if artifact is None:
        raise HTTPException(status_code=404, detail="Shared artifact not found.")
    return ShareFetchResponse(
        token=token,
        kind=artifact.kind,
        payload=artifact.payload,
        expiresAt=artifact.expires_at.isoformat(),
    )
