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
- `pnpm verify:local-stack` support added
- `pnpm lighthouse` support added
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
- Web smoke verification of `/drift` plus generated `/s/[token]` read-only links.
- Worker health route now reports configured runtime limits and startup-applied OS process limits.

## Benchmark evidence captured so far

Local benchmark harness now exists at [scripts/benchmark_worker.py](/C:/Users/chait/OneDrive/Desktop/tools-for-github-push/dataset-profile-tool/scripts/benchmark_worker.py).

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
  meanSeconds: 26.3405
  p95Seconds: 26.3405

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

## Docker verification evidence captured so far

Latest `pnpm verify:local-stack` result:

```text
docker-compose.yml config: PASS
docker-compose.single.yml config: PASS
docker daemon: VERIFY-DEFERRED
reason: failed to connect to npipe:////./pipe/dockerDesktopLinuxEngine
```

This means compose syntax and service wiring are valid, but booting the stack still needs a rerun on a healthy Docker host.

## Lighthouse evidence captured so far

Latest `pnpm lighthouse -- --skip-build` result:

```text
performance: 100
accessibility: 100
best-practices: 100
seo: 100
```

Report artifacts were generated successfully, and the current local audit satisfies the Section 3.12 Lighthouse threshold. The only remaining noise on this machine is a Windows Chrome temp-directory cleanup `EPERM` after the report is written.

## Remaining qualification gaps

- `100 MB CSV`, `100 MB drift`, and `1 GB Parquet` now have passing local evidence.
- Worker memory-cap configuration is now surfaced by `/v1/health`, and the soak harness recorded a `100 MB` run well below the cap, but the `+323.62 MB` retained RSS delta still needs follow-up before we can claim clean memory behavior.
- Docker/local-run evidence for Section 3.3 now has a scripted path, but the daemon on this machine is unavailable, so stack boot remains `VERIFY-DEFERRED`.
- Hosted URL, TLS, deployment, and release-artifact checks are still pending.
- Monaco is now in place, but the Columns table still needs stronger evidence for full checklist-grade virtualization behavior under larger datasets.
- Release-size benchmark evidence now exists for the main worker paths, and the core latency gates are currently green locally.
- Final Appendix B verdict remains open until every Section 3 checkbox has hard evidence.

## Next verification sweep

1. Investigate retained RSS after repeated `100 MB` profiles and decide whether the issue is process reuse, DuckDB allocator behavior, or benchmark methodology.
2. Verify Docker compose boot and health endpoints with logs captured.
3. Complete hosted URL, TLS, and deployment verification evidence.
4. Re-run Section 3 checklist item by item and update this report with concrete outputs.
