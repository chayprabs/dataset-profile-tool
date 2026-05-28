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
TOTAL coverage: 92%
src/core/stats.py: 93%
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
  meanSeconds: 8.2746
  p95Seconds: 10.0990

profile-parquet --target-mb 5 --repeats 2
  meanSeconds: 1.7821
  p95Seconds: 2.0118

profile-parquet --target-mb 100 --repeats 2
  meanSeconds: 9.7672
  p95Seconds: 10.8631

drift-csv --target-mb 5 --repeats 2
  meanSeconds: 3.7346
  p95Seconds: 4.5392

drift-csv --target-mb 100 --repeats 2
  meanSeconds: 18.2202
  p95Seconds: 19.3998

memory-soak-csv --target-mb 5 --iterations 3
  rssBeforeMb: 90.41
  rssAfterMb: 90.91
  rssDeltaMb: 0.50
```

This is useful proof that the benchmark and soak harnesses work and that the worker hot path improved substantially after materializing sources into a temp table and collapsing repeated per-column scans. It still does **not** satisfy the release targets yet because 100 MB CSV and 100 MB drift remain above the checklist thresholds, and 1 GB Parquet evidence is still missing.

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

- Performance targets for 100 MB CSV, 1 GB Parquet, and 100 MB drift are not yet benchmarked.
- Worker memory-cap configuration is now surfaced by `/v1/health`, and the soak harness records RSS deltas, but 4 GB cap evidence is not yet recorded against target-size workloads.
- Docker/local-run evidence for Section 3.3 now has a scripted path, but the daemon on this machine is unavailable, so stack boot remains `VERIFY-DEFERRED`.
- Hosted URL, TLS, deployment, and release-artifact checks are still pending.
- Monaco is now in place, but the Columns table still needs stronger evidence for full checklist-grade virtualization behavior under larger datasets.
- Benchmarks improved sharply, but release-size benchmark evidence is still missing.
- Final Appendix B verdict remains open until every Section 3 checkbox has hard evidence.

## Next verification sweep

1. Add repeatable benchmark commands and capture latency evidence.
2. Add Lighthouse automation/report artifacts.
3. Verify Docker compose boot and health endpoints with logs captured.
4. Re-run Section 3 checklist item by item and update this report with concrete outputs.
