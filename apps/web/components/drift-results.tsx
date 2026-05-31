"use client";

import type { DriftResult } from "@dataprofile/shared-types";

import { buildDriftHtml, buildDriftMarkdown } from "../lib/drift-report";

type DriftResultsProps = {
  apiBaseUrl: string;
  drift: DriftResult;
  onError: (message: string | null) => void;
  readOnly?: boolean;
  setShareUrl: (url: string | null) => void;
  shareUrl: string | null;
};

export function DriftResults({
  apiBaseUrl,
  drift,
  onError,
  readOnly = false,
  setShareUrl,
  shareUrl
}: DriftResultsProps) {
  const grouped = {
    breaking: drift.changes.filter((c) => c.severity === "breaking"),
    compatible: drift.changes.filter((c) => c.severity === "compatible"),
    additive: drift.changes.filter((c) => c.severity === "additive")
  };

  return (
    <div className="workspace-card">
      <div className="export-row">
        <ExportButton content={JSON.stringify(drift, null, 2)} fileName="dataprofile-drift.json" label="JSON" />
        <ExportButton
          content={buildDriftMarkdown(drift)}
          fileName="dataprofile-drift.md"
          label="Markdown"
        />
        <ExportButton content={buildDriftHtml(drift)} fileName="dataprofile-drift.html" label="HTML" />
        {readOnly ? null : (
          <button
            className="btn-secondary"
            onClick={() => void createShare(apiBaseUrl, drift, setShareUrl, onError)}
            type="button"
          >
            Share link
          </button>
        )}
      </div>
      {shareUrl ? (
        <p style={{ fontSize: "0.875rem", marginTop: "0.75rem", wordBreak: "break-all" }}>{shareUrl}</p>
      ) : null}

      <dl className="workspace-metrics" style={{ marginTop: "1rem" }}>
        <MetricCard label="Changes" value={String(drift.changes.length)} />
        <MetricCard label="Breaking" value={String(grouped.breaking.length)} />
        <MetricCard
          label="Other"
          value={String(grouped.compatible.length + grouped.additive.length)}
        />
      </dl>

      <div className="drift-changes" style={{ marginTop: "1.25rem" }}>
        <DriftGroup changes={grouped.breaking} className="drift-group-breaking" title="Breaking" />
        <DriftGroup changes={grouped.compatible} className="drift-group-compatible" title="Compatible" />
        <DriftGroup changes={grouped.additive} className="drift-group-additive" title="Additive" />
        {drift.changes.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No drift detected.</p>
        ) : null}
      </div>
    </div>
  );
}

function DriftGroup({
  changes,
  className,
  title
}: {
  changes: DriftResult["changes"];
  className: string;
  title: string;
}) {
  if (changes.length === 0) {
    return null;
  }
  return (
    <section className={className}>
      <h3 className="drift-group-title">{title}</h3>
      {changes.map((change, index) => (
        <article key={`${change.column}-${change.kind}-${index}`} className="drift-item" style={{ marginBottom: "0.5rem" }}>
          <strong>{change.column}</strong>
          <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--muted)" }}>
            {change.kind}
          </span>
          <p style={{ fontSize: "0.875rem", marginTop: "0.35rem" }}>{change.message}</p>
          {change.patchHint ? (
            <pre
              style={{
                background: "#171717",
                borderRadius: "0.375rem",
                color: "#e5e5e5",
                fontSize: "0.75rem",
                marginTop: "0.5rem",
                overflow: "auto",
                padding: "0.75rem"
              }}
            >
              {JSON.stringify(change.patchHint, null, 2)}
            </pre>
          ) : null}
        </article>
      ))}
    </section>
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
    <button className="btn-secondary" onClick={() => downloadText(content, fileName)} type="button">
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

async function createShare(
  apiBaseUrl: string,
  drift: DriftResult,
  setShareUrl: (url: string | null) => void,
  onError: (message: string | null) => void
) {
  onError(null);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "drift", payload: drift })
    });
    if (!response.ok) {
      throw new Error(`Share failed (${response.status}).`);
    }
    const payload = (await response.json()) as { token: string };
    setShareUrl(`${window.location.origin}/s/${payload.token}`);
  } catch (caught) {
    onError(caught instanceof Error ? caught.message : "Share failed.");
  }
}
