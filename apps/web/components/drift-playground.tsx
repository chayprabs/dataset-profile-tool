"use client";

import { useState } from "react";

import type { DriftResult } from "@dataprofile/shared-types";
import { samples, type SampleDescriptor } from "@dataprofile/shared-worker-runtime";
import { Panel } from "@dataprofile/shared-ui";

import { buildDriftHtml, buildDriftMarkdown } from "../lib/drift-report";

const sourceModes = ["sample", "file", "url"] as const;

type SourceMode = (typeof sourceModes)[number];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

const defaultBeforeSample =
  samples.find((sample) => sample.slug === "drift-week-1") ?? samples[0];
const defaultAfterSample =
  samples.find((sample) => sample.slug === "drift-week-2") ?? samples.at(1) ?? samples[0];

export function DriftPlayground() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("sample");
  const [beforeSample, setBeforeSample] = useState<SampleDescriptor>(defaultBeforeSample);
  const [afterSample, setAfterSample] = useState<SampleDescriptor>(defaultAfterSample);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [drift, setDrift] = useState<DriftResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runDrift() {
    setError(null);
    setShareUrl(null);
    setIsLoading(true);
    try {
      const formData = new FormData();

      if (sourceMode === "sample") {
        await appendSample(formData, "before_file", "before_format", beforeSample);
        await appendSample(formData, "after_file", "after_format", afterSample);
      } else if (sourceMode === "file") {
        if (!beforeFile || !afterFile) {
          throw new Error("Choose both before and after files first.");
        }
        formData.append("before_file", beforeFile, beforeFile.name);
        formData.append("after_file", afterFile, afterFile.name);
      } else {
        if (!beforeUrl.trim() || !afterUrl.trim()) {
          throw new Error("Provide both before and after URLs first.");
        }
        formData.append("before_url", beforeUrl.trim());
        formData.append("after_url", afterUrl.trim());

        const beforeFormat = inferFormatFromName(beforeUrl);
        const afterFormat = inferFormatFromName(afterUrl);
        if (beforeFormat) {
          formData.append("before_format", beforeFormat);
        }
        if (afterFormat) {
          formData.append("after_format", afterFormat);
        }
      }

      const response = await fetch(`${apiBaseUrl}/v1/drift`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Worker drift request failed with ${response.status}.`);
      }

      setDrift((await response.json()) as DriftResult);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Drift request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      <Panel title="Drift">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-white/75 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
                  Snapshot Compare
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Compare two dataset snapshots and classify the change surface.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/65">
                  Run drift from curated fixtures, uploaded files, or remote URLs and export a
                  report your team can review without rerunning the profile job.
                </p>
              </div>
              <button
                className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void runDrift()}
                type="button"
              >
                {isLoading ? "Comparing..." : "Run Drift"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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

            {sourceMode === "sample" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SampleSelector
                  label="Before"
                  onChange={setBeforeSample}
                  options={samples}
                  value={beforeSample.slug}
                />
                <SampleSelector
                  label="After"
                  onChange={setAfterSample}
                  options={samples}
                  value={afterSample.slug}
                />
              </div>
            ) : null}

            {sourceMode === "file" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FileSelector label="Before dataset" onChange={setBeforeFile} />
                <FileSelector label="After dataset" onChange={setAfterFile} />
              </div>
            ) : null}

            {sourceMode === "url" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <UrlSelector label="Before URL" onChange={setBeforeUrl} value={beforeUrl} />
                <UrlSelector label="After URL" onChange={setAfterUrl} value={afterUrl} />
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[1.5rem] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {drift ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <ExportButton
                  content={JSON.stringify(drift, null, 2)}
                  fileName="dataprofile-drift.json"
                  label="Export JSON"
                  mimeType="application/json"
                />
                <ExportButton
                  content={buildDriftMarkdown(drift)}
                  fileName="dataprofile-drift.md"
                  label="Export Markdown"
                  mimeType="text/markdown"
                />
                <ExportButton
                  content={buildDriftHtml(drift)}
                  fileName="dataprofile-drift.html"
                  label="Export HTML"
                  mimeType="text/html"
                />
                <button
                  className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-black/70 transition hover:bg-white"
                  onClick={() => void createDriftShareLink(drift, setShareUrl, setError)}
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
                <MetricCard label="Total changes" value={drift.changes.length.toString()} />
                <MetricCard label="Breaking" value={countSeverity(drift, "breaking").toString()} />
                <MetricCard label="Compatible/Additive" value={countNonBreaking(drift).toString()} />
              </div>

              <div className="grid gap-4">
                {drift.changes.map((change, index) => (
                  <article
                    key={`${change.column}-${change.kind}-${index}`}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{change.column}</h3>
                      <SeverityBadge severity={change.severity} />
                      <KindBadge kind={change.kind} />
                    </div>
                    <p className="mt-3 text-sm text-black/70">{change.message}</p>
                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3">
                        <dt className="text-xs uppercase tracking-[0.2em] text-black/45">Before</dt>
                        <dd className="mt-2 text-black/75">{renderValue(change.before)}</dd>
                      </div>
                      <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3">
                        <dt className="text-xs uppercase tracking-[0.2em] text-black/45">After</dt>
                        <dd className="mt-2 text-black/75">{renderValue(change.after)}</dd>
                      </div>
                    </dl>
                    {change.patchHint ? (
                      <pre className="mt-4 overflow-auto rounded-[1.25rem] bg-[#111111] p-4 text-xs text-[#d7f7ec]">
                        {JSON.stringify(change.patchHint, null, 2)}
                      </pre>
                    ) : null}
                  </article>
                ))}

                {drift.changes.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4 text-sm text-black/65">
                    No drift detected between these snapshots.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/65 p-6 text-sm text-black/60">
              Compare the golden week-over-week fixtures or bring your own pair of datasets.
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Reference">
        <div className="space-y-3 text-sm text-black/70">
          <p>
            `breaking` means a downstream contract likely needs work before rollout. `compatible`
            means the shape widened without obviously violating consumers. `additive` usually
            reflects new optional surface area or broader observed values.
          </p>
          <p>
            Share links are read-only snapshots with the same TTL as the worker share store, so
            they are appropriate for async review but not long-term archival.
          </p>
          <p>
            Start with `drift-week-1` and `drift-week-2` to verify the golden expectation set, then
            switch to file or URL mode for real vendor extracts.
          </p>
        </div>
      </Panel>
    </section>
  );
}

function SampleSelector({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: SampleDescriptor) => void;
  options: SampleDescriptor[];
  value: string;
}) {
  return (
    <label className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4 text-sm">
      <span className="block font-medium">{label}</span>
      <select
        className="mt-3 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
        onChange={(event) => {
          const next = options.find((option) => option.slug === event.target.value);
          if (next) {
            onChange(next);
          }
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FileSelector({
  label,
  onChange
}: {
  label: string;
  onChange: (value: File | null) => void;
}) {
  return (
    <label className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4 text-sm">
      <span className="block font-medium">{label}</span>
      <input
        accept=".csv,.tsv,.json,.jsonl,.parquet,.arrow,.ipc,.avro,.sqlite,.db"
        className="mt-3 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
    </label>
  );
}

function UrlSelector({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="rounded-[1.25rem] border border-[var(--border)] bg-white/80 p-4 text-sm">
      <span className="block font-medium">{label}</span>
      <input
        className="mt-3 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://example.com/snapshot.csv"
        type="url"
        value={value}
      />
    </label>
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

function SeverityBadge({
  severity
}: {
  severity: DriftResult["changes"][number]["severity"];
}) {
  const className =
    severity === "breaking"
      ? "bg-[#fde9dd] text-[#8f3b0e]"
      : severity === "compatible"
        ? "bg-[#fff0cb] text-[#8a5a00]"
        : "bg-[var(--accent-soft)] text-[var(--accent)]";

  return <span className={`rounded-full px-3 py-1 text-xs ${className}`}>{severity}</span>;
}

function KindBadge({ kind }: { kind: DriftResult["changes"][number]["kind"] }) {
  return (
    <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-black/60">
      {kind}
    </span>
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

async function appendSample(
  formData: FormData,
  fileField: "before_file" | "after_file",
  formatField: "before_format" | "after_format",
  sample: SampleDescriptor
) {
  const response = await fetch(sample.path);
  if (!response.ok) {
    throw new Error(`Failed to load ${sample.label}.`);
  }
  const blob = await response.blob();
  formData.append(fileField, blob, sample.path.split("/").pop() ?? `${sample.slug}.${sample.format}`);
  formData.append(formatField, sample.format);
}

function countSeverity(drift: DriftResult, severity: DriftResult["changes"][number]["severity"]) {
  return drift.changes.filter((change) => change.severity === severity).length;
}

function countNonBreaking(drift: DriftResult) {
  return drift.changes.filter((change) => change.severity !== "breaking").length;
}

function renderValue(value: unknown) {
  if (value === undefined) {
    return "-";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
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

async function createDriftShareLink(
  drift: DriftResult,
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
        kind: "drift",
        payload: drift
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
