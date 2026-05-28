import type { ProfileResult } from "@dataprofile/shared-types";

export function buildProfileMarkdown(profile: ProfileResult): string {
  const lines = [
    "# DataProfile Report",
    "",
    `- Format: ${profile.source.format}`,
    `- Rows: ${profile.source.rowCount}`,
    `- Columns: ${profile.columns.length}`,
    `- SHA-256: ${profile.source.sha256}`,
    ""
  ];

  if (profile.warnings.length > 0) {
    lines.push("## Warnings", "", ...profile.warnings.map((warning) => `- ${warning}`), "");
  }

  lines.push("## Columns", "");
  for (const column of profile.columns) {
    lines.push(`### ${column.name}`);
    lines.push(`- Type: ${column.inferredType}`);
    lines.push(`- Null %: ${column.nullPct.toFixed(2)}`);
    lines.push(`- Unique %: ${column.uniquePct.toFixed(2)}`);
    if (column.piiFlags.length > 0) {
      lines.push(`- PII: ${column.piiFlags.join(", ")}`);
    }
    if (column.anomalies.length > 0) {
      lines.push(`- Anomalies: ${column.anomalies.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildProfileHtml(profile: ProfileResult): string {
  const columnRows = profile.columns
    .map(
      (column) => `
        <tr>
          <td>${escapeHtml(column.name)}</td>
          <td>${escapeHtml(column.inferredType)}</td>
          <td>${column.nullPct.toFixed(2)}%</td>
          <td>${column.uniquePct.toFixed(2)}%</td>
          <td>${escapeHtml(column.piiFlags.join(", ") || "-")}</td>
          <td>${escapeHtml(column.anomalies.join(", ") || "-")}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>DataProfile Report</title>
    <style>
      body { font-family: Georgia, serif; margin: 40px; color: #171717; }
      h1, h2 { margin-bottom: 12px; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid #d8d0c4; padding: 10px; text-align: left; vertical-align: top; }
      th { background: #f1eadf; }
      .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; max-width: 48rem; }
      .card { border: 1px solid #d8d0c4; border-radius: 16px; padding: 16px; background: #fbf8f2; }
    </style>
  </head>
  <body>
    <h1>DataProfile Report</h1>
    <div class="meta">
      <div class="card"><strong>Format</strong><div>${escapeHtml(profile.source.format)}</div></div>
      <div class="card"><strong>Rows</strong><div>${profile.source.rowCount}</div></div>
      <div class="card"><strong>Columns</strong><div>${profile.columns.length}</div></div>
      <div class="card"><strong>SHA-256</strong><div>${escapeHtml(profile.source.sha256)}</div></div>
    </div>
    <h2>Columns</h2>
    <table>
      <thead>
        <tr>
          <th>Column</th>
          <th>Type</th>
          <th>Null %</th>
          <th>Unique %</th>
          <th>PII</th>
          <th>Anomalies</th>
        </tr>
      </thead>
      <tbody>${columnRows}</tbody>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
