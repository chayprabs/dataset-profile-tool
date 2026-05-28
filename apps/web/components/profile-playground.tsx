"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { ProfileResult } from "@dataprofile/shared-types";
import { samples, type SampleDescriptor } from "@dataprofile/shared-worker-runtime";
import { Panel } from "@dataprofile/shared-ui";

const tabs = ["Overview", "Columns", "Schema", "Sample", "Anomalies"] as const;
const sampleModes = ["head", "tail", "random"] as const;

type TabKey = (typeof tabs)[number];
type SampleMode = (typeof sampleModes)[number];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export function ProfilePlayground() {
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [selectedSample, setSelectedSample] = useState<SampleDescriptor>(samples[0]);
  const [sampleMode, setSampleMode] = useState<SampleMode>("head");
  const [redactSamples, setRedactSamples] = useState(true);
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      void runProfile(samples[0], "head");
    }
  }, [profile]);

  const piiColumns = useMemo(() => {
    const names = new Set<string>();
    for (const column of profile?.columns ?? []) {
      if (column.piiFlags.length > 0) {
        names.add(column.name);
      }
    }
    return names;
  }, [profile]);

  async function runProfile(sample: SampleDescriptor, mode: SampleMode) {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(sample.path);
      if (!response.ok) {
        throw new Error(`Failed to load ${sample.label}.`);
      }

      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, sample.path.split("/").pop() ?? `${sample.slug}.${sample.format}`);
      formData.append("sampleMode", mode);
      formData.append("sampleSize", "20");

      const profileResponse = await fetch(`${apiBaseUrl}/v1/profile`, {
        method: "POST",
        body: formData
      });

      if (!profileResponse.ok) {
        throw new Error(`Worker profile request failed with ${profileResponse.status}.`);
      }

      const payload = (await profileResponse.json()) as ProfileResult;
      setProfile(payload);
      setSelectedSample(sample);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Profile request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <Panel title="Playground">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-white/75 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
                  Signature Move
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Profile a real fixture and inspect the contract immediately.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/65">
                  This first interactive pass focuses on sample-driven profiling,
                  schema review, anomaly inspection, and PII-safe sample previews.
                </p>
              </div>
              <button
                className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void runProfile(selectedSample, sampleMode)}
                type="button"
              >
                {isLoading ? "Profiling..." : "Profile Sample"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {sampleModes.map((mode) => (
                <button
                  key={mode}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    sampleMode === mode
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border)] bg-white text-black/75"
                  }`}
                  onClick={() => {
                    setSampleMode(mode);
                    void runProfile(selectedSample, mode);
                  }}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-[1.5rem] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {profile ? (
            <>
              <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      activeTab === tab
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--border)] bg-white/80 text-black/70"
                    }`}
                    onClick={() => setActiveTab(tab)}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "Overview" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Rows" value={profile.source.rowCount.toLocaleString()} />
                  <MetricCard label="Columns" value={profile.columns.length.toString()} />
                  <MetricCard
                    label="Warnings"
                    value={profile.warnings.length ? profile.warnings.length.toString() : "0"}
                  />
                </div>
              ) : null}

              {activeTab === "Columns" ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white/80">
                  <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_1fr_1fr] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-black/45">
                    <span>Column</span>
                    <span>Type</span>
                    <span>Null %</span>
                    <span>Unique %</span>
                    <span>Signals</span>
                  </div>
                  <div className="max-h-[26rem] overflow-auto">
                    {profile.columns.map((column) => (
                      <div
                        key={column.name}
                        className="grid grid-cols-[1.6fr_0.8fr_0.8fr_1fr_1fr] gap-3 border-b border-[var(--border)] px-4 py-4 text-sm last:border-b-0"
                      >
                        <div>
                          <p className="font-semibold">{column.name}</p>
                          <p className="mt-1 text-xs text-black/55">
                            {column.topValues
                              .slice(0, 3)
                              .map((item) => `${String(item.value)} (${item.count})`)
                              .join(", ")}
                          </p>
                        </div>
                        <span>{column.inferredType}</span>
                        <span>{column.nullPct.toFixed(1)}%</span>
                        <span>{column.uniquePct.toFixed(1)}%</span>
                        <span className="flex flex-wrap gap-2">
                          {column.piiFlags.map((flag) => (
                            <Badge key={`${column.name}-${flag}`} tone="alert">
                              {flag}
                            </Badge>
                          ))}
                          {column.anomalies.map((anomaly) => (
                            <Badge key={`${column.name}-${anomaly}`} tone="muted">
                              {anomaly}
                            </Badge>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "Schema" ? (
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#111111] p-4 text-xs text-[#d7f7ec]">
                  <pre className="overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(profile.schema, null, 2)}
                  </pre>
                </div>
              ) : null}

              {activeTab === "Sample" ? (
                <div className="space-y-4">
                  <label className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm">
                    <input
                      checked={redactSamples}
                      onChange={(event) => setRedactSamples(event.target.checked)}
                      type="checkbox"
                    />
                    Auto-redact flagged PII columns
                  </label>
                  <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white/80">
                    <div className="overflow-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-[var(--accent-soft)] text-left text-xs uppercase tracking-[0.2em] text-black/55">
                          <tr>
                            {Object.keys(profile.sampleRows[0] ?? {}).map((columnName) => (
                              <th key={columnName} className="px-4 py-3 font-medium">
                                {columnName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {profile.sampleRows.map((row, index) => (
                            <tr key={`sample-row-${index}`} className="border-t border-[var(--border)]">
                              {Object.entries(row).map(([columnName, value]) => (
                                <td key={`${index}-${columnName}`} className="px-4 py-3 align-top text-black/75">
                                  {renderSampleValue(value, redactSamples && piiColumns.has(columnName))}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "Anomalies" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.columns
                    .filter((column) => column.anomalies.length > 0)
                    .map((column) => (
                      <div
                        key={column.name}
                        className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4"
                      >
                        <p className="font-semibold">{column.name}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {column.anomalies.map((anomaly) => (
                            <Badge key={`${column.name}-${anomaly}`} tone="alert">
                              {anomaly}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  {profile.columns.every((column) => column.anomalies.length === 0) ? (
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4 text-sm text-black/65">
                      No anomaly hints surfaced for this fixture.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/65 p-6 text-sm text-black/60">
              Loading the first profile...
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Samples">
        <ul className="space-y-3 text-sm">
          {samples.map((sample) => {
            const isActive = sample.slug === selectedSample.slug;
            return (
              <li key={sample.slug}>
                <button
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-white/70 hover:bg-white"
                  }`}
                  onClick={() => {
                    setSelectedSample(sample);
                    void runProfile(sample, sampleMode);
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">{sample.label}</span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.25em]">
                      {sample.format}
                    </span>
                  </div>
                  <p className="mt-2 text-black/65">{sample.description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({
  children,
  tone
}: {
  children: ReactNode;
  tone: "alert" | "muted";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        tone === "alert" ? "bg-[#fde9dd] text-[#8f3b0e]" : "bg-[var(--accent-soft)] text-[var(--accent)]"
      }`}
    >
      {children}
    </span>
  );
}

function renderSampleValue(value: unknown, shouldRedact: boolean) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (!shouldRedact) {
    return String(value);
  }
  const text = String(value);
  if (text.length <= 4) {
    return "••••";
  }
  return `${text.slice(0, 2)}••••${text.slice(-2)}`;
}
