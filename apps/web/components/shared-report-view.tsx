"use client";

import { useMemo, useState } from "react";

import type { DriftResult, ProfileResult } from "@dataprofile/shared-types";

import { buildPiiColumnSet, redactSchema } from "../lib/pii-columns";

import { ColumnsTable } from "./columns-table";
import { DriftResults } from "./drift-results";
import { SampleGrid } from "./sample-grid";
import { SchemaViewer } from "./schema-viewer";

const profileTabs = ["Overview", "Columns", "Schema", "Sample", "Anomalies"] as const;
type ProfileTab = (typeof profileTabs)[number];

export function SharedProfileReport({ profile }: { profile: ProfileResult }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");
  const [redactSamples, setRedactSamples] = useState(true);

  const piiColumns = useMemo(() => buildPiiColumnSet(profile.columns), [profile.columns]);
  const displaySchema = useMemo(
    () => (redactSamples ? redactSchema(profile.schema, profile.columns) : profile.schema),
    [profile.columns, profile.schema, redactSamples]
  );

  return (
    <div className="workspace">
      <div className="workspace-card">
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
          Read-only shared profile · expires when the worker TTL elapses
        </p>
        <dl className="workspace-metrics" style={{ marginTop: "1rem" }}>
          <MetricCard label="Format" value={profile.source.format} />
          <MetricCard label="Rows" value={profile.source.rowCount.toLocaleString()} />
          <MetricCard label="Columns" value={String(profile.columns.length)} />
        </dl>
      </div>

      <div className="workspace-card">
        <div className="workspace-tabs">
          {profileTabs.map((tab) => (
            <button
              key={tab}
              className={`workspace-tab ${activeTab === tab ? "workspace-tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" ? (
          <div style={{ marginTop: "1rem" }}>
            {profile.warnings.length > 0 ? (
              <ul style={{ paddingLeft: "1.25rem", margin: "0 0 1rem" }}>
                {profile.warnings.map((warning) => (
                  <li key={warning} style={{ fontSize: "0.875rem" }}>
                    {warning}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                No runtime warnings for this snapshot.
              </p>
            )}
          </div>
        ) : null}

        {activeTab === "Columns" ? (
          <div style={{ marginTop: "1rem" }}>
            <ColumnsTable columns={profile.columns} redactPii={redactSamples} />
          </div>
        ) : null}

        {activeTab === "Schema" ? (
          <div style={{ marginTop: "1rem" }}>
            <SchemaViewer schema={displaySchema} />
          </div>
        ) : null}

        {activeTab === "Sample" ? (
          <div style={{ marginTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <input
                checked={redactSamples}
                onChange={(event) => setRedactSamples(event.target.checked)}
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
              .filter((column) => column.anomalies.length > 0)
              .map((column) => (
                <div key={column.name} className="drift-item">
                  <strong>{column.name}</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                    {column.anomalies.map((anomaly) => (
                      <span key={anomaly} className="pii-badge" style={{ background: "#fff7ed", color: "#9a3412" }}>
                        {anomaly}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {profile.columns.every((column) => column.anomalies.length === 0) ? (
              <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No anomalies detected.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SharedDriftReport({
  apiBaseUrl,
  drift
}: {
  apiBaseUrl: string;
  drift: DriftResult;
}) {
  return (
    <div className="workspace">
      <div className="workspace-card">
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
          Read-only shared drift report
        </p>
      </div>
      <DriftResults
        apiBaseUrl={apiBaseUrl}
        drift={drift}
        onError={() => undefined}
        readOnly
        setShareUrl={() => undefined}
        shareUrl={null}
      />
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
