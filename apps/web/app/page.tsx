import { Panel, StatPill } from "@dataprofile/shared-ui";

import { ProfilePlayground } from "../components/profile-playground";

const tabs = ["Overview", "Columns", "Schema", "Sample", "Anomalies", "Drift"];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-lg shadow-black/5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
              DataProfile
            </p>
            <h1 className="mt-2 text-4xl font-semibold">
              Stream dataset profiling through DuckDB.
            </h1>
          </div>
          <a
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
            href="https://github.com/chayprabs/dataset-profile-tool"
          >
            GitHub
          </a>
        </div>
        <p className="max-w-3xl text-base leading-7 text-black/70">
          Drop a file, paste a presigned URL, or open a sample to inspect
          schema, per-column stats, drift, anomaly hints, and PII-safe
          samples without dragging the full dataset into memory.
        </p>
        <div className="flex flex-wrap gap-3">
          <StatPill label="Formats" value="8" />
          <StatPill label="Worker" value="FastAPI + DuckDB" />
          <StatPill label="Outputs" value="Profile, Schema, Drift" />
        </div>
      </header>

      <ProfilePlayground />

      <section className="grid gap-6 md:grid-cols-3">
        {tabs.map((tab) => (
          <Panel key={tab} title={tab}>
            <p className="text-sm leading-6 text-black/65">
              {tab === "Overview"
                ? "Quick health, row count, coverage, and worker warnings."
                : tab === "Columns"
                  ? "Type inference, nulls, uniqueness, PII signals, and top values."
                  : tab === "Schema"
                    ? "Draft 2020-12 schema output ready for AJV validation."
                    : tab === "Sample"
                      ? "Head, tail, or random samples with safe redaction."
                      : "Column-level anomaly hints to focus follow-up checks."}
            </p>
          </Panel>
        ))}
      </section>
    </main>
  );
}
