import type { ColumnProfile } from "@dataprofile/shared-types";

/** Build a set of column keys that should trigger sample redaction (handles SQLite prefixes). */
export function buildPiiColumnSet(columns: ColumnProfile[]): Set<string> {
  const names = new Set<string>();
  for (const column of columns) {
    if (column.piiFlags.length === 0) {
      continue;
    }
    names.add(column.name);
    const dot = column.name.lastIndexOf(".");
    if (dot >= 0) {
      names.add(column.name.slice(dot + 1));
    }
  }
  return names;
}

export function shouldRedactSampleKey(columnKey: string, piiColumns: Set<string>): boolean {
  if (piiColumns.has(columnKey)) {
    return true;
  }
  for (const flagged of piiColumns) {
    if (flagged.endsWith(`.${columnKey}`)) {
      return true;
    }
  }
  return false;
}

export function redactSampleValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  const text = String(value);
  if (text.length <= 4) {
    return "[redacted]";
  }
  return `${text.slice(0, 2)}[redacted]${text.slice(-2)}`;
}

export function redactSampleRows(
  rows: Array<Record<string, unknown>>,
  piiColumns: Set<string>
): Array<Record<string, unknown>> {
  return rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      next[key] = shouldRedactSampleKey(key, piiColumns) ? redactSampleValue(value) : value;
    }
    return next;
  });
}
