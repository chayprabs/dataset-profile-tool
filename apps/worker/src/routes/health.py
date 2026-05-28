from __future__ import annotations

import duckdb
from fastapi import APIRouter, Request

from core.duckdb_session import EXTENSIONS
from core.runtime_limits import runtime_limit_snapshot

router = APIRouter(tags=["health"])


@router.get("/v1/health")
def healthcheck(request: Request):
    return {
        "status": "ok",
        "duckdbVersion": duckdb.__version__,
        "extensions": list(EXTENSIONS),
        "limits": runtime_limit_snapshot(),
        "runtimeLimitState": getattr(request.app.state, "runtime_limits", {"applied": [], "warnings": []}),
    }
