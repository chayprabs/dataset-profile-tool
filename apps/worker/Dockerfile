FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app/apps/worker
COPY apps/worker/pyproject.toml ./pyproject.toml
COPY apps/worker/src ./src
RUN pip install --upgrade pip && pip install .
RUN python - <<'PY'
import duckdb

con = duckdb.connect()
for extension in ("httpfs", "parquet", "sqlite_scanner", "json"):
    con.execute(f"INSTALL {extension};")
    con.execute(f"LOAD {extension};")
print(con.execute("SELECT version()").fetchone()[0])
PY
EXPOSE 8080
CMD ["uvicorn", "main:app", "--app-dir", "/app/apps/worker/src", "--host", "0.0.0.0", "--port", "8080"]
