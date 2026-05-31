import type { ColumnProfile, ProfileResult } from "@dataprofile/shared-types";

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

export function columnHasPiiFlags(column: ColumnProfile): boolean {
  return column.piiFlags.length > 0;
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

export function formatColumnValue(value: unknown, column: ColumnProfile, redactPii: boolean): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (redactPii && columnHasPiiFlags(column)) {
    return redactSampleValue(value);
  }
  return String(value);
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

function schemaPropertyIsPii(propertyKey: string, columns: ColumnProfile[]): boolean {
  return columns.some(
    (column) =>
      column.piiFlags.length > 0 &&
      (column.name === propertyKey || column.name.endsWith(`.${propertyKey}`))
  );
}

/** Redact examples/enums in JSON Schema for PII-flagged properties. */
export function redactSchema(
  schema: Record<string, unknown>,
  columns: ColumnProfile[]
): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
  const properties = clone.properties;
  if (!properties || typeof properties !== "object") {
    return clone;
  }
  for (const [propertyKey, rawProperty] of Object.entries(properties as Record<string, unknown>)) {
    if (!schemaPropertyIsPii(propertyKey, columns)) {
      continue;
    }
    const property = rawProperty as Record<string, unknown>;
    if (Array.isArray(property.examples)) {
      property.examples = property.examples.map((example) => redactSampleValue(example));
    }
    if (Array.isArray(property.enum)) {
      property.enum = property.enum.map((value) => redactSampleValue(value));
    }
  }
  return clone;
}

export function buildExportProfile(profile: ProfileResult, redactSamples: boolean): ProfileResult {
  if (!redactSamples) {
    return profile;
  }
  const piiColumns = buildPiiColumnSet(profile.columns);
  return {
    ...profile,
    sampleRows: redactSampleRows(profile.sampleRows, piiColumns),
    schema: redactSchema(profile.schema, profile.columns)
  };
}
