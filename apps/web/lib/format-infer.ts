const FORMAT_SUFFIXES: ReadonlyArray<readonly [suffix: string, format: string]> = [
  [".parquet", "parquet"],
  [".jsonl", "jsonl"],
  [".arrow", "arrow"],
  [".avro", "avro"],
  [".sqlite", "sqlite"],
  [".json", "json"],
  [".csv", "csv"],
  [".tsv", "tsv"],
  [".ipc", "arrow"],
  [".db", "sqlite"]
];

export function inferFormatFromName(value: string): string | null {
  let path = value;
  try {
    path = new URL(value).pathname;
  } catch {
    // not a URL
  }
  const lower = path.toLowerCase();
  for (const [suffix, format] of FORMAT_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return format;
    }
  }
  return null;
}
