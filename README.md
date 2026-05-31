# DataProfile

DataProfile is an open-source online dataset profiler for CSV, TSV, JSON, JSONL, Parquet, Arrow, Avro, and SQLite files. Upload a file or paste a URL to inspect column types, null rates, cardinality, JSON Schema, PII hints, anomalies, and week-over-week schema drift — streamed through DuckDB on the server so large files stay out of browser memory.

## Quick start

```bash
pnpm install
python3 -m pip install -e apps/worker[dev]
docker compose up --build
```

Open `http://localhost:3000` for the playground. The worker health check is `http://localhost:8080/v1/health`.

## Workspace layout

- `apps/web` — Next.js 15 playground (minimal white UI, profile + drift on the home page)
- `apps/worker` — FastAPI worker with DuckDB profiling engine
- `packages/shared-types` — shared TypeScript contracts
- `packages/shared-ui` — shared UI primitives
- `packages/shared-worker-runtime` — sample metadata and client helpers

## Self-host

```bash
pnpm install
python3 -m pip install -e apps/worker[dev]
pnpm build
python3 -m uvicorn main:app --app-dir apps/worker/src --host 0.0.0.0 --port 8080
pnpm --dir apps/web start -- --hostname 0.0.0.0 --port 3000
```

Or use Docker Compose:

```bash
docker compose up --build
```

## Documentation

Product and release docs live in `docs/`:

- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/IMPLEMENTATION_HANDOFF.md`
- `docs/RELEASE_QUALIFICATION_CHECKLIST.md`
- `docs/qc-appendix-b.md`

Regenerate binary samples after changing fixtures:

```bash
pnpm samples:generate
```

## Verification

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker-coverage && pnpm build
pnpm verify:deployment-artifacts
python3 scripts/verify_acceptance.py
python3 scripts/verify_privacy_security.py
```

## Deployment

Production scaffolding is included for Cloudflare (web) and Fly.io (worker). See `deploy/README.md`, `apps/web/wrangler.jsonc`, and `fly.toml`.

## Links

- GitHub: https://github.com/chayprabs/dataset-profile-tool
- Author: https://www.chaitanyaprabuddha.com
- X: https://x.com/chayprabs

## License

AGPL-3.0 — see [LICENSE](LICENSE).
