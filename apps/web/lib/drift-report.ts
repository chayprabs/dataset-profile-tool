import type { DriftResult } from "@dataprofile/shared-types";

export function buildDriftMarkdown(drift: DriftResult): string {
  const lines = [
    "# DataProfile Drift Report",
    "",
    `- Total changes: ${drift.changes.length}`,
    `- Added columns: ${drift.added.length}`,
    `- Removed columns: ${drift.removed.length}`,
    ""
  ];

  if (drift.changes.length === 0) {
    lines.push("No drift detected.", "");
    return lines.join("\n");
  }

  lines.push("## Changes", "");
  for (const change of drift.changes) {
    lines.push(`### ${change.column}`);
    lines.push(`- Kind: ${change.kind}`);
    lines.push(`- Severity: ${change.severity}`);
    lines.push(`- Message: ${change.message}`);
    if (change.before !== undefined) {
      lines.push(`- Before: ${stringifyValue(change.before)}`);
    }
    if (change.after !== undefined) {
      lines.push(`- After: ${stringifyValue(change.after)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildDriftHtml(drift: DriftResult): string {
  const rows = drift.changes
    .map(
      (change) => `
        <tr>
          <td>${escapeHtml(change.column)}</td>
          <td>${escapeHtml(change.kind)}</td>
          <td>${escapeHtml(change.severity)}</td>
          <td>${escapeHtml(change.message)}</td>
          <td>${escapeHtml(stringifyValue(change.before))}</td>
          <td>${escapeHtml(stringifyValue(change.after))}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>DataProfile Drift Report</title>
    <style>
      body { font-family: Georgia, serif; margin: 40px; color: #171717; }
      h1, h2 { margin-bottom: 12px; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid #d8d0c4; padding: 10px; text-align: left; vertical-align: top; }
      th { background: #f1eadf; }
      .meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; max-width: 56rem; }
      .card { border: 1px solid #d8d0c4; border-radius: 16px; padding: 16px; background: #fbf8f2; }
    </style>
  </head>
  <body>
    <h1>DataProfile Drift Report</h1>
    <div class="meta">
      <div class="card"><strong>Total changes</strong><div>${drift.changes.length}</div></div>
      <div class="card"><strong>Added columns</strong><div>${drift.added.length}</div></div>
      <div class="card"><strong>Removed columns</strong><div>${drift.removed.length}</div></div>
    </div>
    <h2>Changes</h2>
    <table>
      <thead>
        <tr>
          <th>Column</th>
          <th>Kind</th>
          <th>Severity</th>
          <th>Message</th>
          <th>Before</th>
          <th>After</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">No drift detected.</td></tr>'}</tbody>
    </table>
  </body>
</html>`;
}

function stringifyValue(value: unknown): string {
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
