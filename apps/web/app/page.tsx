import { samples } from "@dataprofile/shared-worker-runtime";
import { Panel, StatPill } from "@dataprofile/shared-ui";

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

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Playground">
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/70 p-8 text-center">
            <p className="text-lg font-semibold">
              Upload, paste URL, or try a sample dataset.
            </p>
            <p className="mt-2 text-sm text-black/65">
              The worker endpoints come next. This scaffold already mirrors the
              required v1 information architecture and result tabs.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {tabs.map((tab) => (
                <span
                  key={tab}
                  className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm"
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Samples">
          <ul className="space-y-3 text-sm">
            {samples.map((sample) => (
              <li
                key={sample.slug}
                className="rounded-2xl border border-[var(--border)] bg-white/70 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">{sample.label}</span>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs uppercase tracking-[0.25em]">
                    {sample.format}
                  </span>
                </div>
                <p className="mt-2 text-black/65">{sample.description}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </main>
  );
}
