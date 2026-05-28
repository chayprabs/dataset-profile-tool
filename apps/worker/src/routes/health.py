from __future__ import annotations

import duckdb
from fastapi import APIRouter

from core.duckdb_session import EXTENSIONS

router = APIRouter(tags=["health"])


@router.get("/v1/health")
def healthcheck():
    return {
        "status": "ok",
        "duckdbVersion": duckdb.__version__,
        "extensions": list(EXTENSIONS),
    }
