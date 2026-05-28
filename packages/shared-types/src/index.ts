export type ProfileType =
  | "int"
  | "float"
  | "string"
  | "bool"
  | "date"
  | "datetime"
  | "timestamp"
  | "binary"
  | "mixed";

export type ProfileFormat =
  | "csv"
  | "tsv"
  | "json"
  | "jsonl"
  | "parquet"
  | "arrow"
  | "avro"
  | "sqlite";

export interface TopValue {
  value: string | number | boolean | null;
  count: number;
}

export interface NumericStats {
  min: number | null;
  max: number | null;
  mean: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p95: number | null;
  p99: number | null;
  stddev: number | null;
  histogram: number[];
}

export interface StringStats {
  minLen: number;
  maxLen: number;
  charClasses: Record<string, number>;
}

export interface DateStats {
  min: string | null;
  max: string | null;
  pattern: string | null;
}

export interface BooleanStats {
  trueCount: number;
  falseCount: number;
}

export interface ColumnProfile {
  name: string;
  inferredType: ProfileType;
  nullable: boolean;
  nullCount: number;
  nullPct: number;
  uniqueCount: number;
  uniquePct: number;
  topValues: TopValue[];
  format?: string | null;
  numeric?: NumericStats | null;
  string?: StringStats | null;
  date?: DateStats | null;
  boolean?: BooleanStats | null;
  piiFlags: string[];
  anomalies: string[];
  confidence: number;
}

export interface ProfileResult {
  jobId: string;
  source: {
    format: ProfileFormat;
    sizeBytes: number;
    rowCount: number;
    sha256: string;
  };
  columns: ColumnProfile[];
  schema: Record<string, unknown>;
  warnings: string[];
  sampleRows: Array<Record<string, unknown>>;
}

export interface DriftChange {
  kind: "added" | "removed" | "type" | "range" | "cardinality";
  column: string;
  severity: "additive" | "compatible" | "breaking";
  before?: unknown;
  after?: unknown;
  patchHint?: Record<string, unknown>;
  message: string;
}

export interface DriftResult {
  added: string[];
  removed: string[];
  typeChanges: DriftChange[];
  rangeChanges: DriftChange[];
  cardinalityChanges: DriftChange[];
  changes: DriftChange[];
}
