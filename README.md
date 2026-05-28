# DataProfile

DataProfile is an open-source online dataset profile tool for CSV, TSV, JSON, JSONL, Parquet, Arrow, Avro, and SQLite files. It profiles schema, column stats, JSON Schema output, drift changes, anomalies, and PII hints without loading the whole dataset into memory.

## Workspace

- `apps/web`: Next.js 15 playground UI.
- `apps/worker`: FastAPI worker backed by DuckDB.
- `packages/shared-types`: shared contracts for profile, drift, and schema data.
- `packages/shared-ui`: shared UI primitives for cards and result panes.
- `packages/shared-worker-runtime`: client/runtime helpers and sample metadata.

## Local development

```bash
pnpm install
python -m pip install -e apps/worker[dev]
docker compose up --build
```

The web app runs on `http://localhost:3000` and the worker health check is `http://localhost:8080/v1/health`.
