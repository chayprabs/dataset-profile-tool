# Appendix B - QC Verification Report

This report tracks release-gate evidence for `dataset-profile-tool` against
`RELEASE_QUALIFICATION_CHECKLIST.md` Section 3. Update it on each verification sweep.

## Current snapshot

- Branch: `cursor/data-profile-build`
- Status: `NOT QUALIFIED YET`
- Verified locally on: `2026-05-29`

## Passed local checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:worker-coverage`
- `pnpm verify:deployment-artifacts` support added
- `pnpm verify:local-stack` support added
- `pnpm lighthouse` support added
- `pnpm measure:worker-rss -- <scenario> --target-mb <N>` support added
- `python scripts/benchmark_worker.py profile-csv --target-mb 25 --repeats 3` support added
- `python scripts/benchmark_worker.py profile-parquet --target-mb 25 --repeats 3` support added
- `python scripts/benchmark_worker.py drift-csv --target-mb 25 --repeats 3` support added
- `python scripts/benchmark_worker.py memory-soak-csv --target-mb 25 --iterations 10` support added

## Worker coverage evidence

Latest local worker coverage run:

```text
TOTAL coverage: 88%
src/core/stats.py: 91%
src/core/pii.py: 92%
src/core/anomalies.py: 97%
src/core/schema.py: 94%
```

Coverage gate policy is enforced by:

- [scripts/validate_worker_coverage.py](/C:/Users/chait/OneDrive/Desktop/tools-for-github-push/dataset-profile-tool/scripts/validate_worker_coverage.py)
- `.github/workflows/ci.yml` `Worker coverage gate`

## Functional evidence already exercised

- Multi-format profile routes for CSV, TSV, JSON, JSONL, Parquet, Arrow IPC, Avro, and SQLite.
- AJV round-trip schema tests for sample fixtures.
- Drift golden tests for `drift-week-1.csv` vs `drift-week-2.csv`.
- Share-link flow for profile and drift snapshots.
- Share-link expiry is covered at both store and endpoint level in `apps/worker/tests/test_share.py`.
- Web smoke verification of `/drift` plus generated `/s/[token]` read-only links.
- Worker health route now reports configured runtime limits and startup-applied OS process limits.
- The columns table and sample grid are both virtualized in the web UI.
- A dedicated `/opengraph-image` route now backs Open Graph/Twitter preview images.

## Benchmark evidence captured so far

Local benchmark harness now exists at [scripts/benchmark_worker.py](/C:/Users/chait/OneDrive/Desktop/tools-for-github-push/dataset-profile-tool/scripts/benchmark_worker.py), and sampled worker-process RSS verification exists at [scripts/measure_worker_peak_rss.py](/C:/Users/chait/OneDrive/Desktop/tools-for-github-push/dataset-profile-tool/scripts/measure_worker_peak_rss.py).

Latest lightweight local sample runs:

```text
profile-csv --target-mb 25 --repeats 2
  meanSeconds: 3.7975
  p95Seconds: 4.6517

profile-csv --target-mb 50 --repeats 2
  meanSeconds: 5.5592
  p95Seconds: 6.0953

profile-csv --target-mb 100 --repeats 2
  meanSeconds: 4.0254
  p95Seconds: 4.1920

profile-parquet --target-mb 5 --repeats 2
  meanSeconds: 1.7821
  p95Seconds: 2.0118

profile-parquet --target-mb 100 --repeats 2
  meanSeconds: 9.7672
  p95Seconds: 10.8631

profile-parquet --target-mb 1000 --repeats 1
  meanSeconds: 24.6330
  p95Seconds: 24.6330

drift-csv --target-mb 5 --repeats 2
  meanSeconds: 3.7346
  p95Seconds: 4.5392

drift-csv --target-mb 100 --repeats 2
  meanSeconds: 6.9178
  p95Seconds: 6.9777

memory-soak-csv --target-mb 100 --iterations 3
  rssBeforeMb: 90.14
  rssAfterMb: 413.76
  rssDeltaMb: 323.62
  p95Seconds: 5.3501
```

This is now enough evidence to mark the three main latency gates as locally satisfied on this machine: `100 MB CSV <= 5s p95`, `100 MB drift <= 12s p95`, and `1 GB Parquet <= 30s p95`. The worker gets there by reusing rolled multipart temp files for large uploads, using a lean drift profile path, and switching to approximate unique counts for clearly high-cardinality columns on very large Parquet sources with an explicit warning. The soak run also stays well below the 4 GB process cap, but the retained RSS delta on Windows is large enough that memory behavior still needs another investigation pass before calling it fully qualified.

## Worker peak RSS evidence

The in-process benchmark harness is conservative for latency and useful for regression tracking, but its RSS values include the client and worker in the same Python process. The worker-only memory check now uses an external uvicorn process and sampled RSS:

```text
measure_worker_peak_rss.py profile-csv --target-mb 100
  seconds: 4.9953
  peakRssMb: 318.03

measure_worker_peak_rss.py drift-csv --target-mb 100
  seconds: 9.0736
  peakRssMb: 276.81

measure_worker_peak_rss.py profile-parquet --target-mb 1000
  seconds: 24.8121
  peakRssMb: 387.51
```

This sampled worker-process evidence is currently the strongest proof we have for Section 3.12 memory behavior on this machine, and all three measured scenarios remained far below the configured `4096 MB` cap.

## Docker verification evidence captured so far

Latest `pnpm verify:local-stack` result:

```text
docker-compose.yml config: PASS
docker-compose.single.yml config: PASS
docker daemon: VERIFY-DEFERRED
reason: failed to connect to npipe:////./pipe/dockerDesktopLinuxEngine
```

This means compose syntax and service wiring are valid, but booting the stack still needs a rerun on a healthy Docker host.

## Release artifact evidence captured so far

- `.github/workflows/release.yml` now builds both app images on `release.published`.
- Manual `workflow_dispatch` runs can either build-only or push custom tags to GHCR.
- Target image names are `ghcr.io/<owner>/dataprofile-web` and `ghcr.io/<owner>/dataprofile-worker`.

This closes the earlier repository-side release-workflow placeholder, but it does not yet satisfy Section 3.15 by itself. We still need one successful release workflow execution with pushed images recorded as evidence.

## Lighthouse evidence captured so far

Latest `pnpm lighthouse -- --skip-build` result:

```text
performance: 100
accessibility: 100
best-practices: 100
seo: 100
```

Report artifacts were generated successfully, and the current local audit satisfies the Section 3.12 Lighthouse threshold. The only remaining noise on this machine is a Windows Chrome temp-directory cleanup `EPERM` after the report is written.

## Acceptance fixture evidence

Latest `pnpm verify:acceptance` result:

```text
A1: pass
  all 13 bundled samples profiled within their target thresholds
  slowest sample: anomaly-lab.csv at 2.0336s

A2: pass
  pnpm --dir apps/web exec vitest run app/schema-roundtrip.test.ts
  2 passed

A3: pass
  added: ["loyalty_points"]
  rangeColumns: ["spend"]
  cardinalityColumns: ["tier"]
```

This gives us a single reproducible command for PRD Section 20 rather than relying on separate nearby tests and benchmark notes.

The verifier also flushed out and helped confirm a regression fix on the Avro path: profiling `users.avro` no longer leaves a sibling `users.jsonl` artifact in the source directory, because conversion now happens inside the per-job temp area.

## Security and repo metadata evidence

- GitHub repository topics now include: `data-profiling`, `csv`, `parquet`, `jsonl`, `avro`, `sqlite`, `json-schema`, `schema-inference`, `data-quality`, `eda`, `schema-drift`, `duckdb`, `dataset-profiler`, `online-tool`.
- README now includes the required first-100-word terms, a real product screenshot, self-host instructions, and the release-image publication path. The hosted production URL is still pending and is called out explicitly instead of pointing at a placeholder domain.
- Remote CSV and drift URLs now profile directly through DuckDB `httpfs` without creating a local download copy, covered in `apps/worker/tests/test_remote_sources.py`.
- `python scripts/verify_privacy_security.py` now exercises the live worker against `pii-laden.csv` and remote URL fixtures, then fails if raw PII sample values appear in worker logs.
- Latest `pnpm verify:privacy-security` result:

```text
workerLogRedaction.status: pass
workerLogRedaction.leakedValues: []
remoteUrlProfile.status: pass
remoteUrlProfile.rowCount: 5
remoteUrlDrift.status: pass
remoteUrlDrift.added: ["loyalty_points"]
```
- Local production headers from `next start` include:

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Deployment artifact evidence

- `apps/web/wrangler.jsonc` now provides a checked-in OpenNext Cloudflare worker shape with `.open-next/worker.js`, explicit compatibility flags, asset binding, and worker self-reference binding.
- `apps/web/public/_headers` now sets immutable caching for `/_next/static/*`.
- `fly.toml` remains the checked-in worker deployment baseline with Dockerfile build wiring, `/v1/health` checks, and a `4gb` performance preset VM.
- `deploy/r2-lifecycle-rules.example.json` documents the intended one-day retention policy for ephemeral share and upload prefixes.
- `deploy/README.md` now gives a concrete runbook for Cloudflare Workers, Fly.io, R2, and the final hosted verification sweep.
- `python scripts/verify_deployment_artifacts.py` verifies the presence and shape of those deployment artifacts through `pnpm verify:deployment-artifacts`.

## Remaining qualification gaps

- `100 MB CSV`, `100 MB drift`, and `1 GB Parquet` now have passing local evidence.
- Worker memory-cap configuration is now surfaced by `/v1/health`, and sampled worker-process RSS stayed well below `4096 MB` for `100 MB CSV`, `100 MB drift`, and `1 GB Parquet`. The remaining gap is methodological hardening: we should decide whether the external RSS probe should replace the older in-process soak in the formal checklist runbook.
- Docker/local-run evidence for Section 3.3 now has a scripted path, but the daemon on this machine is unavailable, so stack boot remains `VERIFY-DEFERRED`.
- Hosted URL, TLS, deployment, and first successful release-image publish are still pending.
- Deployment artifacts are now present and documented, but live provider evidence is still missing: no hosted Cloudflare URL has been verified, no Fly deployment has been observed healthy in two regions yet, and no R2 lifecycle has been confirmed from a real bucket.
- Privacy evidence is stronger now: remote URL handling no longer downloads local copies before profiling, and the live worker log check did not leak any raw values from `pii-laden.csv`.
- Acceptance fixture evidence is now explicit through `pnpm verify:acceptance`, and the current run is green for A1, A2, and A3.
- Monaco is now in place with copy/download controls, and both the sample grid and columns table are virtualized. The remaining UI gap is stronger runtime evidence for those surfaces under larger datasets.
- Release-size benchmark evidence now exists for the main worker paths, and the core latency gates are currently green locally.
- Final Appendix B verdict remains open until every Section 3 checkbox has hard evidence.

## Next verification sweep

1. Decide whether to promote the external worker RSS probe into the primary Section 3 memory-check runbook and trim the older in-process soak wording accordingly.
2. Verify Docker compose boot and health endpoints with logs captured.
3. Run the release workflow once and record the pushed GHCR image tags.
4. Complete hosted URL, TLS, and deployment verification evidence.
5. Re-run Section 3 checklist item by item and update this report with concrete outputs.
