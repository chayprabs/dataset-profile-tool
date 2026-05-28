FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY apps/worker/pyproject.toml ./apps/worker/pyproject.toml
RUN pip install --upgrade pip && pip install -e ./apps/worker
RUN python - <<'PY'
import duckdb

con = duckdb.connect()
for extension in ("httpfs", "parquet", "sqlite_scanner", "json"):
    con.execute(f"INSTALL {extension};")
    con.execute(f"LOAD {extension};")
print(con.execute("SELECT version()").fetchone()[0])
PY

COPY apps/worker/src ./apps/worker/src
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
