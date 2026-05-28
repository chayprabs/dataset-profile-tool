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

## Remaining qualification gaps

- Lighthouse >= 95 across all four categories is not yet recorded.
- Performance targets for 100 MB CSV, 1 GB Parquet, and 100 MB drift are not yet benchmarked.
- Worker memory-cap evidence is not yet recorded.
- Docker/local-run evidence for Section 3.3 still needs an explicit verification sweep.
- Hosted URL, TLS, deployment, and release-artifact checks are still pending.
- Monaco is now in place, but the Columns table still needs stronger evidence for full checklist-grade virtualization behavior under larger datasets.
- Final Appendix B verdict remains open until every Section 3 checkbox has hard evidence.

## Next verification sweep

1. Add repeatable benchmark commands and capture latency evidence.
2. Add Lighthouse automation/report artifacts.
3. Verify Docker compose boot and health endpoints with logs captured.
4. Re-run Section 3 checklist item by item and update this report with concrete outputs.
