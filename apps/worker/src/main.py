from __future__ import annotations

from fastapi import FastAPI

from routes.drift import router as drift_router
from routes.health import router as health_router
from routes.profile import router as profile_router
from routes.schema_infer import router as schema_router

app = FastAPI(title="DataProfile Worker", version="0.1.0")
app.include_router(health_router)
app.include_router(profile_router)
app.include_router(schema_router)
app.include_router(drift_router)
