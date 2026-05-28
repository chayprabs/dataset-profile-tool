from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from core.duckdb_session import ensure_extensions_installed
from core.runtime_limits import apply_runtime_limits
from routes.drift import router as drift_router
from routes.health import router as health_router
from routes.profile import router as profile_router
from routes.schema_infer import router as schema_router
from routes.share import router as share_router
from settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_extensions_installed()
    app.state.runtime_limits = apply_runtime_limits()
    yield


app = FastAPI(title="DataProfile Worker", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def wall_clock_timeout(request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=settings.job_wall_clock_seconds)
    except TimeoutError:
        return JSONResponse(
            status_code=504,
            content={"detail": f"request exceeded {settings.job_wall_clock_seconds}s wall-clock limit"},
        )


app.include_router(health_router)
app.include_router(profile_router)
app.include_router(schema_router)
app.include_router(drift_router)
app.include_router(share_router)
