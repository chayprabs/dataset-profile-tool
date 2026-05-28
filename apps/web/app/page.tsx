import Link from "next/link";

import { Panel, StatPill } from "@dataprofile/shared-ui";

import { ProfilePlayground } from "../components/profile-playground";

const tabs = ["Overview", "Columns", "Schema", "Sample", "Anomalies", "Drift"];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which dataset formats can DataProfile inspect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DataProfile supports CSV, TSV, JSON, JSONL, Parquet, Arrow IPC, Avro, and SQLite sources."
      }
    },
    {
      "@type": "Question",
      name: "Can DataProfile infer JSON Schema from real data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The worker generates Draft 2020-12 JSON Schema with confidence scores, examples, and format hints based on observed values."
      }
    },
    {
      "@type": "Question",
      name: "Does DataProfile support week-over-week drift analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The drift mode compares two snapshots and groups changes into additive, compatible, and breaking classifications with report exports and share links."
      }
    }
  ]
};

export default function HomePage() {
  return (
    <main className="ui-shell flex min-h-screen flex-col gap-8">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />
      <header className="ui-hero grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
        <div className="space-y-6">
          <div>
            <p className="ui-kicker">DataProfile</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.035em] lg:text-6xl">
              Fast, server-side dataset profiling with a quieter interface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/68 lg:text-lg">
              Profile CSV, TSV, JSON, JSONL, Parquet, Arrow, Avro, and SQLite files
              through DuckDB, inspect drift and anomaly hints, and export shareable
              reports without hauling the full dataset into the browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-white shadow-sm shadow-[var(--accent)]/20"
              href="/drift"
            >
              Open Drift Mode
            </Link>
            <a
              className="rounded-full border border-[var(--border-strong)] bg-white/78 px-5 py-2.5 text-sm text-black/78"
              href="https://github.com/chayprabs/dataset-profile-tool"
            >
              View Source
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill label="Formats" value="8" />
            <StatPill label="Worker" value="DuckDB + FastAPI" />
            <StatPill label="Outputs" value="Profile / Schema / Drift" />
          </div>
        </div>
        <div className="ui-soft-card grid gap-5 p-6 lg:p-7">
          <div className="flex items-center justify-between">
            <p className="ui-kicker">What You Get</p>
            <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-black/55">
              Minimal by default
            </span>
          </div>
          <div className="space-y-4 text-sm leading-6 text-black/68">
            <p>
              The profile surface is built for quick first-pass diagnosis: clean metrics,
              expandable column detail, a schema view you can copy directly, and a sample
              grid that redacts flagged PII by default.
            </p>
            <p>
              When drift matters, the compare flow groups changes into additive,
              compatible, and breaking categories and keeps export/share actions close
              to the result instead of hiding them behind secondary menus.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/75 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-black/45">Profiling</dt>
              <dd className="mt-2 text-lg font-semibold">Column stats, schema, anomalies, PII</dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/75 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-black/45">Review</dt>
              <dd className="mt-2 text-lg font-semibold">Exports, share links, drift snapshots</dd>
            </div>
          </dl>
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
                      : tab === "Anomalies"
                        ? "Column-level anomaly hints to focus follow-up checks."
                        : "Snapshot-to-snapshot change classification with shareable exports."}
            </p>
          </Panel>
        ))}
      </section>
    </main>
  );
}
