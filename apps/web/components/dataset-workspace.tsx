"use client";

import { useMemo, useState } from "react";

import type { DriftResult, ProfileResult } from "@dataprofile/shared-types";
import { samples, type SampleDescriptor } from "@dataprofile/shared-worker-runtime";

import { ColumnsTable } from "./columns-table";
import { DriftResults } from "./drift-results";
import { FileDrop } from "./file-drop";
import { SampleGrid } from "./sample-grid";
import { SchemaViewer } from "./schema-viewer";
import { buildProfileHtml, buildProfileMarkdown } from "../lib/profile-report";

const profileTabs = ["Overview", "Columns", "Schema", "Sample", "Anomalies"] as const;
const sampleModes = ["head", "tail", "random"] as const;
const sourceModes = ["upload", "url", "sample"] as const;
const workspaceModes = ["profile", "drift"] as const;

type ProfileTab = (typeof profileTabs)[number];
type SampleMode = (typeof sampleModes)[number];
type SourceMode = (typeof sourceModes)[number];
type WorkspaceMode = (typeof workspaceModes)[number];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

const profileSamples = samples.filter((s) => !s.slug.startsWith("drift-week"));
const driftBeforeDefault =
  samples.find((s) => s.slug === "drift-week-1") ?? profileSamples[0];
const driftAfterDefault =
  samples.find((s) => s.slug === "drift-week-2") ?? profileSamples[1] ?? profileSamples[0];

export function DatasetWorkspace({ defaultMode = "profile" }: { defaultMode?: WorkspaceMode }) {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(defaultMode);
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [selectedSample, setSelectedSample] = useState<SampleDescriptor>(profileSamples[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [sampleMode, setSampleMode] = useState<SampleMode>("head");
  const [redactSamples, setRedactSamples] = useState(true);
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [beforeSample, setBeforeSample] = useState(driftBeforeDefault);
  const [afterSample, setAfterSample] = useState(driftAfterDefault);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [drift, setDrift] = useState<DriftResult | null>(null);
  const [driftShareUrl, setDriftShareUrl] = useState<string | null>(null);

  const piiColumns = useMemo(() => {
    const names = new Set<string>();
    for (const column of profile?.columns ?? []) {
      if (column.piiFlags.length > 0) {
        names.add(column.name);
      }
    }
    return names;
  }, [profile]);

  async function runProfile() {
    setError(null);
    setShareUrl(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (sourceMode === "upload") {
        if (!selectedFile) {
          throw new Error("Choose a file to profile.");
        }
        formData.append("file", selectedFile, selectedFile.name);
      } else if (sourceMode === "url") {
        if (!remoteUrl.trim()) {
          throw new Error("Enter a dataset URL.");
        }
        formData.append("url", remoteUrl.trim());
        const inferred = inferFormatFromName(remoteUrl);
        if (inferred) {
          formData.append("format", inferred);
        }
      } else {
        const blob = await fetchSampleBlob(selectedSample);
        formData.append(
          "file",
          blob,
          selectedSample.path.split("/").pop() ?? `${selectedSample.slug}.${selectedSample.format}`
        );
      }
      formData.append("sampleMode", sampleMode);
      formData.append("sampleSize", "20");

      const response = await fetch(`${apiBaseUrl}/v1/profile`, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error(`Profile failed (${response.status}).`);
      }
      setProfile((await response.json()) as ProfileResult);
      setActiveTab("Overview");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profile failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function runDrift() {
    setError(null);
    setDriftShareUrl(null);
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (sourceMode === "upload") {
        if (!beforeFile || !afterFile) {
          throw new Error("Choose both before and after files.");
        }
        formData.append("before_file", beforeFile, beforeFile.name);
        formData.append("after_file", afterFile, afterFile.name);
      } else if (sourceMode === "url") {
        if (!beforeUrl.trim() || !afterUrl.trim()) {
          throw new Error("Enter both before and after URLs.");
        }
        formData.append("before_url", beforeUrl.trim());
        formData.append("after_url", afterUrl.trim());
        const bf = inferFormatFromName(beforeUrl);
        const af = inferFormatFromName(afterUrl);
        if (bf) {
          formData.append("before_format", bf);
        }
        if (af) {
          formData.append("after_format", af);
        }
      } else {
        await appendSample(formData, "before_file", "before_format", beforeSample);
        await appendSample(formData, "after_file", "after_format", afterSample);
      }

      const response = await fetch(`${apiBaseUrl}/v1/drift`, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error(`Drift compare failed (${response.status}).`);
      }
      setDrift((await response.json()) as DriftResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Drift compare failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="workspace">
      <div className="workspace-modes">
        {workspaceModes.map((mode) => (
          <button
            key={mode}
            className={`workspace-mode ${workspaceMode === mode ? "workspace-mode-active" : ""}`}
            onClick={() => {
              setWorkspaceMode(mode);
              setError(null);
            }}
            type="button"
          >
            {mode === "profile" ? "Profile dataset" : "Compare drift"}
          </button>
        ))}
      </div>

      <div className="workspace-card">
        <div className="workspace-modes" style={{ marginBottom: "0.75rem" }}>
          {sourceModes.map((mode) => (
            <button
              key={mode}
              className={`workspace-mode ${sourceMode === mode ? "workspace-mode-active" : ""}`}
              onClick={() => setSourceMode(mode)}
              type="button"
            >
              {mode === "upload" ? "Upload" : mode === "url" ? "URL" : "Sample"}
            </button>
          ))}
        </div>

        {sourceMode === "upload" && workspaceMode === "profile" ? (
          <FileDrop disabled={isLoading} file={selectedFile} onFileChange={setSelectedFile} />
        ) : null}

        {sourceMode === "upload" && workspaceMode === "drift" ? (
          <div className="workspace-row workspace-row-2">
            <div>
              <span className="workspace-label">Before</span>
              <FileDrop disabled={isLoading} file={beforeFile} onFileChange={setBeforeFile} />
            </div>
            <div>
              <span className="workspace-label">After</span>
              <FileDrop disabled={isLoading} file={afterFile} onFileChange={setAfterFile} />
            </div>
          </div>
        ) : null}

        {sourceMode === "url" ? (
          <div className={`workspace-row ${workspaceMode === "drift" ? "workspace-row-2" : ""}`}>
            <div>
              {workspaceMode === "drift" ? <span className="workspace-label">Before URL</span> : null}
              <input
                className="workspace-input"
                onChange={(e) =>
                  workspaceMode === "drift" ? setBeforeUrl(e.target.value) : setRemoteUrl(e.target.value)
                }
                placeholder="https://example.com/data.parquet"
                type="url"
                value={workspaceMode === "drift" ? beforeUrl : remoteUrl}
              />
            </div>
            {workspaceMode === "drift" ? (
              <div>
                <span className="workspace-label">After URL</span>
                <input
                  className="workspace-input"
                  onChange={(e) => setAfterUrl(e.target.value)}
                  placeholder="https://example.com/data-v2.parquet"
                  type="url"
                  value={afterUrl}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {sourceMode === "sample" && workspaceMode === "profile" ? (
          <div className="workspace-samples">
            {profileSamples.map((sample) => (
              <button
                key={sample.slug}
                className={`workspace-sample ${sample.slug === selectedSample.slug ? "workspace-sample-active" : ""}`}
                onClick={() => setSelectedSample(sample)}
                type="button"
              >
                {sample.label}
              </button>
            ))}
          </div>
        ) : null}

        {sourceMode === "sample" && workspaceMode === "drift" ? (
          <div className="workspace-row workspace-row-2">
            <div>
              <span className="workspace-label">Before sample</span>
              <select
                className="workspace-input"
                onChange={(e) => {
                  const next = samples.find((s) => s.slug === e.target.value);
                  if (next) {
                    setBeforeSample(next);
                  }
                }}
                value={beforeSample.slug}
              >
                {samples.map((s) => (
                  <option key={`before-${s.slug}`} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="workspace-label">After sample</span>
              <select
                className="workspace-input"
                onChange={(e) => {
                  const next = samples.find((s) => s.slug === e.target.value);
                  if (next) {
                    setAfterSample(next);
                  }
                }}
                value={afterSample.slug}
              >
                {samples.map((s) => (
                  <option key={`after-${s.slug}`} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {workspaceMode === "profile" ? (
          <div className="workspace-samples" style={{ marginTop: "0.75rem" }}>
            {sampleModes.map((mode) => (
              <button
                key={mode}
                className={`workspace-sample ${sampleMode === mode ? "workspace-sample-active" : ""}`}
                onClick={() => setSampleMode(mode)}
                type="button"
              >
                {mode} sample
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: "1rem" }}>
          <button
            className="btn-primary"
            disabled={isLoading}
            onClick={() => void (workspaceMode === "profile" ? runProfile() : runDrift())}
            type="button"
          >
            {isLoading
              ? "Working…"
              : workspaceMode === "profile"
                ? "Run profile"
                : "Compare drift"}
          </button>
        </div>
      </div>

      {error ? <div className="workspace-error">{error}</div> : null}

      {workspaceMode === "profile" && profile ? (
        <ProfileResults
          activeTab={activeTab}
          onShare={async () => {
            setError(null);
            try {
              const response = await fetch(`${apiBaseUrl}/v1/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "profile", payload: profile })
              });
              if (!response.ok) {
                throw new Error(`Share failed (${response.status}).`);
              }
              const payload = (await response.json()) as { token: string };
              setShareUrl(`${window.location.origin}/s/${payload.token}`);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Share failed.");
            }
          }}
          onTabChange={setActiveTab}
          piiColumns={piiColumns}
          profile={profile}
          redactSamples={redactSamples}
          setRedactSamples={setRedactSamples}
          shareUrl={shareUrl}
        />
      ) : null}

      {workspaceMode === "drift" && drift ? (
        <DriftResults
          apiBaseUrl={apiBaseUrl}
          drift={drift}
          onError={setError}
          shareUrl={driftShareUrl}
          setShareUrl={setDriftShareUrl}
        />
      ) : null}
    </div>
  );
}

function ProfileResults({
  activeTab,
  onShare,
  onTabChange,
  piiColumns,
  profile,
  redactSamples,
  setRedactSamples,
  shareUrl
}: {
  activeTab: ProfileTab;
  onShare: () => Promise<void>;
  onTabChange: (tab: ProfileTab) => void;
  piiColumns: Set<string>;
  profile: ProfileResult;
  redactSamples: boolean;
  setRedactSamples: (value: boolean) => void;
  shareUrl: string | null;
}) {
  return (
    <div className="workspace-card">
      <div className="workspace-tabs">
        {profileTabs.map((tab) => (
          <button
            key={tab}
            className={`workspace-tab ${activeTab === tab ? "workspace-tab-active" : ""}`}
            onClick={() => onTabChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" ? (
        <div style={{ marginTop: "1rem" }}>
          <div className="export-row">
            <ExportButton
              content={JSON.stringify(profile, null, 2)}
              fileName="dataprofile-report.json"
              label="JSON"
            />
            <ExportButton
              content={buildProfileMarkdown(profile)}
              fileName="dataprofile-report.md"
              label="Markdown"
            />
            <ExportButton
              content={buildProfileHtml(profile)}
              fileName="dataprofile-report.html"
              label="HTML"
            />
            <ExportButton
              content={JSON.stringify(profile.schema, null, 2)}
              fileName="dataprofile.schema.json"
              label="Schema"
            />
            <button className="btn-secondary" onClick={() => void onShare()} type="button">
              Share link
            </button>
          </div>
          {shareUrl ? (
            <p style={{ fontSize: "0.875rem", marginTop: "0.75rem", wordBreak: "break-all" }}>
              {shareUrl}
            </p>
          ) : null}
          <dl className="workspace-metrics" style={{ marginTop: "1rem" }}>
            <MetricCard label="Rows" value={profile.source.rowCount.toLocaleString()} />
            <MetricCard label="Columns" value={String(profile.columns.length)} />
            <MetricCard label="Format" value={profile.source.format} />
            <MetricCard label="Size" value={formatBytes(profile.source.sizeBytes)} />
          </dl>
          {profile.warnings.length > 0 ? (
            <ul style={{ marginTop: "1rem", paddingLeft: "1.25rem" }}>
              {profile.warnings.map((w) => (
                <li key={w} style={{ fontSize: "0.875rem" }}>
                  {w}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {activeTab === "Columns" ? (
        <div style={{ marginTop: "1rem" }}>
          <ColumnsTable columns={profile.columns} />
        </div>
      ) : null}

      {activeTab === "Schema" ? (
        <div style={{ marginTop: "1rem" }}>
          <SchemaViewer schema={profile.schema} />
        </div>
      ) : null}

      {activeTab === "Sample" ? (
        <div style={{ marginTop: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input
              checked={redactSamples}
              onChange={(e) => setRedactSamples(e.target.checked)}
              type="checkbox"
            />
            <span style={{ fontSize: "0.875rem" }}>Redact flagged PII columns</span>
          </label>
          <SampleGrid piiColumns={piiColumns} redactSamples={redactSamples} rows={profile.sampleRows} />
        </div>
      ) : null}

      {activeTab === "Anomalies" ? (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
          {profile.columns
            .filter((c) => c.anomalies.length > 0)
            .map((column) => (
              <div key={column.name} className="drift-item">
                <strong>{column.name}</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                  {column.anomalies.map((a) => (
                    <span key={a} className="pii-badge" style={{ background: "#fff7ed", color: "#9a3412" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          {profile.columns.every((c) => c.anomalies.length === 0) ? (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No anomalies detected.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ExportButton({
  content,
  fileName,
  label
}: {
  content: string;
  fileName: string;
  label: string;
}) {
  return (
    <button
      className="btn-secondary"
      onClick={() => downloadText(content, fileName)}
      type="button"
    >
      {label}
    </button>
  );
}

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchSampleBlob(sample: SampleDescriptor) {
  const response = await fetch(sample.path);
  if (!response.ok) {
    throw new Error(`Failed to load ${sample.label}.`);
  }
  return response.blob();
}

async function appendSample(
  formData: FormData,
  fileField: "before_file" | "after_file",
  formatField: "before_format" | "after_format",
  sample: SampleDescriptor
) {
  const blob = await fetchSampleBlob(sample);
  formData.append(fileField, blob, sample.path.split("/").pop() ?? `${sample.slug}.${sample.format}`);
  formData.append(formatField, sample.format);
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
