from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from settings import settings


ShareArtifactKind = Literal["profile", "drift"]


@dataclass
class StoredArtifact:
    kind: ShareArtifactKind
    payload: dict[str, Any]
    created_at: datetime
    expires_at: datetime


class ShareStore:
    def __init__(self) -> None:
        self._items: dict[str, StoredArtifact] = {}

    def create(self, kind: ShareArtifactKind, payload: dict[str, Any]) -> tuple[str, StoredArtifact]:
        now = datetime.now(UTC)
        artifact = StoredArtifact(
            kind=kind,
            payload=payload,
            created_at=now,
            expires_at=now + timedelta(seconds=settings.job_ttl_seconds),
        )
        token = secrets.token_urlsafe(12)
        self._items[token] = artifact
        self._purge_expired(now)
        return token, artifact

    def get(self, token: str) -> StoredArtifact | None:
        now = datetime.now(UTC)
        self._purge_expired(now)
        artifact = self._items.get(token)
        if artifact is None or artifact.expires_at <= now:
            self._items.pop(token, None)
            return None
        return artifact

    def _purge_expired(self, now: datetime) -> None:
        expired_tokens = [token for token, artifact in self._items.items() if artifact.expires_at <= now]
        for token in expired_tokens:
            self._items.pop(token, None)


share_store = ShareStore()
