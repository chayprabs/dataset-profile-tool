"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProfileResult } from "@dataprofile/shared-types";
import { samples, type SampleDescriptor } from "@dataprofile/shared-worker-runtime";
import { Panel } from "@dataprofile/shared-ui";

import { ColumnsTable } from "./columns-table";
import { SampleGrid } from "./sample-grid";
import { SchemaViewer } from "./schema-viewer";
import { buildProfileHtml, buildProfileMarkdown } from "../lib/profile-report";

const tabs = ["Overview", "Columns", "Schema", "Sample", "Anomalies"] as const;
const sampleModes = ["head", "tail", "random"] as const;
const sourceModes = ["sample", "file", "url"] as const;

type TabKey = (typeof tabs)[number];
type SampleMode = (typeof sampleModes)[number];
type SourceMode = (typeof sourceModes)[number];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export function ProfilePlayground() {
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [sourceMode, setSourceMode] = useState<SourceMode>("sample");
  const [selectedSample, setSelectedSample] = useState<SampleDescriptor>(samples[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [sampleMode, setSampleMode] = useState<SampleMode>("head");
  const [redactSamples, setRedactSamples] = useState(true);
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      void runProfile({ mode: "head", sample: samples[0] });
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

  async function runProfile({
    file,
    mode,
    sample,
    url
  }: {
    file?: File | null;
    mode: SampleMode;
    sample?: SampleDescriptor;
    url?: string;
  }) {
    setError(null);
    setShareUrl(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file, file.name);
      } else if (url) {
        formData.append("url", url);
        const inferredFormat = inferFormatFromName(url);
        if (inferredFormat) {
          formData.append("format", inferredFormat);
        }
      } else if (sample) {
        const response = await fetch(sample.path);
        if (!response.ok) {
          throw new Error(`Failed to load ${sample.label}.`);
        }
        const blob = await response.blob();
        formData.append("file", blob, sample.path.split("/").pop() ?? `${sample.slug}.${sample.format}`);
      } else {
        throw new Error("Choose a sample, file, or URL first.");
      }

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
      if (sample) {
        setSelectedSample(sample);
      }
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
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-white/78 p-5 shadow-sm shadow-black/5">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="ui-kicker">Signature Move</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                  Profile a dataset from sample, upload, or URL and keep the first read clean.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">
                  Schema, column stats, anomalies, PII-safe samples, and export actions stay
                  in one focused workspace so the initial inspection loop stays short.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[var(--border)] bg-[#faf4ea] px-3 py-1">
                    Source: {sourceMode}
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[#faf4ea] px-3 py-1">
                    Sample mode: {sampleMode}
                  </span>
                  {sourceMode === "sample" ? (
                    <span className="rounded-full border border-[var(--border)] bg-[#faf4ea] px-3 py-1">
                      Fixture: {selectedSample.label}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#faf4ea] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Actions</p>
                <div className="mt-3 grid gap-3">
                  <button
                    className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
                    disabled={isLoading}
                    onClick={() => {
                      if (sourceMode === "file") {
                        void runProfile({ file: selectedFile, mode: sampleMode });
                        return;
                      }
                      if (sourceMode === "url") {
                        void runProfile({ mode: sampleMode, url: remoteUrl.trim() });
                        return;
                      }
                      void runProfile({ mode: sampleMode, sample: selectedSample });
                    }}
                    type="button"
                  >
                    {isLoading ? "Profiling..." : "Run Profile"}
                  </button>
                  <LinkButton href="/drift" label="Open Drift Workspace" />
                </div>
                <p className="mt-3 text-xs leading-5 text-black/55">
                  Best when you want one quick profile read before deciding whether deeper drift work is needed.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.35rem] border border-[var(--border)] bg-[#faf4ea] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Source mode</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {sourceModes.map((mode) => (
                    <button
                      key={mode}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        sourceMode === mode
                          ? "bg-[#1a4037] text-white"
                          : "border border-[var(--border)] bg-white text-black/75"
                      }`}
                      onClick={() => setSourceMode(mode)}
                      type="button"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[var(--border)] bg-[#faf4ea] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Sample mode</p>
                <div className="mt-3 flex flex-wrap gap-3">
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
                        if (sourceMode === "sample") {
                          void runProfile({ mode, sample: selectedSample });
                        }
                      }}
                      type="button"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {sourceMode === "sample" ? (
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/72 p-4 text-sm text-black/60">
                Using curated fixtures for fast iteration and stable regression checks.
              </div>
            ) : null}

            {sourceMode === "file" ? (
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4">
                <label className="block text-sm font-medium">Upload dataset</label>
                <input
                  accept=".csv,.tsv,.json,.jsonl,.parquet,.arrow,.ipc,.avro,.sqlite,.db"
                  className="mt-3 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <p className="mt-2 text-xs text-black/55">
                  Supports CSV, TSV, JSON, JSONL, Parquet, Arrow IPC, Avro, and SQLite.
                </p>
              </div>
            ) : null}

            {sourceMode === "url" ? (
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4">
                <label className="block text-sm font-medium">Remote dataset URL</label>
                <input
                  className="mt-3 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  onChange={(event) => setRemoteUrl(event.target.value)}
                  placeholder="https://example.com/data.parquet"
                  type="url"
                  value={remoteUrl}
                />
                <p className="mt-2 text-xs text-black/55">
                  Best with direct HTTPS or presigned object-storage URLs.
                </p>
              </div>
            ) : null}
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
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <ExportButton
                      content={JSON.stringify(profile, null, 2)}
                      fileName="dataprofile-report.json"
                      label="Export JSON"
                      mimeType="application/json"
                    />
                    <ExportButton
                      content={buildProfileMarkdown(profile)}
                      fileName="dataprofile-report.md"
                      label="Export Markdown"
                      mimeType="text/markdown"
                    />
                    <ExportButton
                      content={buildProfileHtml(profile)}
                      fileName="dataprofile-report.html"
                      label="Export HTML"
                      mimeType="text/html"
                    />
                    <ExportButton
                      content={JSON.stringify(profile.schema, null, 2)}
                      fileName="dataprofile.schema.json"
                      label="Export Schema"
                      mimeType="application/schema+json"
                    />
                    <button
                      className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-black/70 transition hover:bg-white"
                      onClick={() => void createShareLink(profile, setShareUrl, setError)}
                      type="button"
                    >
                      Create Share Link
                    </button>
                  </div>
                  {shareUrl ? (
                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4 text-sm">
                      <p className="font-medium">Share URL</p>
                      <p className="mt-2 break-all text-black/65">{shareUrl}</p>
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard label="Rows" subtitle="Observed in the active source" value={profile.source.rowCount.toLocaleString()} />
                    <MetricCard label="Columns" subtitle="Profiled with type inference" value={profile.columns.length.toString()} />
                    <MetricCard
                      label="Warnings"
                      subtitle="Runtime or format caveats"
                      value={profile.warnings.length ? profile.warnings.length.toString() : "0"}
                    />
                  </div>
                  {profile.warnings.length > 0 ? (
                    <div className="grid gap-3">
                      {profile.warnings.map((warning) => (
                        <div
                          key={warning}
                          className="rounded-[1.25rem] border border-[#e7d3be] bg-[#fff6ea] px-4 py-3 text-sm text-[#7b4d20]"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "Columns" ? (
                <ColumnsTable columns={profile.columns} />
              ) : null}

              {activeTab === "Schema" ? (
                <SchemaViewer schema={profile.schema} />
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
                  <SampleGrid piiColumns={piiColumns} redactSamples={redactSamples} rows={profile.sampleRows} />
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
                            <span
                              key={`${column.name}-${anomaly}`}
                              className="rounded-full bg-[#fde9dd] px-3 py-1 text-xs text-[#8f3b0e]"
                            >
                              {anomaly}
                            </span>
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
                    setSourceMode("sample");
                    void runProfile({ mode: sampleMode, sample });
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
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-black/40">
                    {isActive ? "Active fixture" : "Click to load"}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}

function MetricCard({ label, subtitle, value }: { label: string; subtitle: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-2 text-xs leading-5 text-black/50">{subtitle}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ExportButton({
  content,
  fileName,
  label,
  mimeType
}: {
  content: string;
  fileName: string;
  label: string;
  mimeType: string;
}) {
  return (
    <button
      className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-black/70 transition hover:bg-white"
      onClick={() => downloadTextFile(content, fileName, mimeType)}
      type="button"
    >
      {label}
    </button>
  );
}

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function inferFormatFromName(value: string): string | null {
  const lower = value.toLowerCase();
  const suffixes = [
    ".csv",
    ".tsv",
    ".json",
    ".jsonl",
    ".parquet",
    ".arrow",
    ".ipc",
    ".avro",
    ".sqlite",
    ".db"
  ] as const;
  const matched = suffixes.find((suffix) => lower.endsWith(suffix));
  return matched ? matched.slice(1).replace("db", "sqlite").replace("ipc", "arrow") : null;
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="rounded-full border border-[var(--border-strong)] bg-white/88 px-4 py-3 text-center text-sm text-black/75"
      href={href}
    >
      {label}
    </a>
  );
}

async function createShareLink(
  profile: ProfileResult,
  setShareUrl: (value: string | null) => void,
  setError: (value: string | null) => void
) {
  setError(null);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        kind: "profile",
        payload: profile
      })
    });
    if (!response.ok) {
      throw new Error(`Share link request failed with ${response.status}.`);
    }
    const payload = (await response.json()) as { token: string };
    setShareUrl(`${window.location.origin}/s/${payload.token}`);
  } catch (caughtError) {
    setError(caughtError instanceof Error ? caughtError.message : "Share link request failed.");
  }
}
