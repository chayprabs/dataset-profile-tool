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
profile-csv --target-mb 5 --repeats 2
  meanSeconds: 29.4799
  p95Seconds: 31.2508

memory-soak-csv --target-mb 5 --iterations 3
  rssBeforeMb: 90.41
  rssAfterMb: 90.91
  rssDeltaMb: 0.50
```

This is useful proof that the benchmark and soak harnesses work, but it does **not** satisfy the release targets yet.

## Remaining qualification gaps

- Lighthouse >= 95 across all four categories is not yet recorded.
- Performance targets for 100 MB CSV, 1 GB Parquet, and 100 MB drift are not yet benchmarked.
- Worker memory-cap configuration is now surfaced by `/v1/health`, and the soak harness records RSS deltas, but 4 GB cap evidence is not yet recorded against target-size workloads.
- Docker/local-run evidence for Section 3.3 still needs an explicit verification sweep.
- Hosted URL, TLS, deployment, and release-artifact checks are still pending.
- Monaco is now in place, but the Columns table still needs stronger evidence for full checklist-grade virtualization behavior under larger datasets.
- Current lightweight benchmark timings are far above the PRD latency targets, so profiling performance still needs focused optimization.
- Final Appendix B verdict remains open until every Section 3 checkbox has hard evidence.

## Next verification sweep

1. Add repeatable benchmark commands and capture latency evidence.
2. Add Lighthouse automation/report artifacts.
3. Verify Docker compose boot and health endpoints with logs captured.
4. Re-run Section 3 checklist item by item and update this report with concrete outputs.
