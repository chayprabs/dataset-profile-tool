import { FeatureLanding } from "../../components/feature-landing";

export default function CsvProfilerPage() {
  return (
    <FeatureLanding
      bullets={[
        "Upload or paste a CSV URL and inspect types, nulls, cardinality, and top values without spinning up a notebook.",
        "Generate Draft 2020-12 JSON Schema output for contract checks and downstream validation.",
        "Review PII-safe sample rows, anomaly hints, and exports from the same playground."
      ]}
      ctaHref="/"
      ctaLabel="Open CSV Profiler"
      eyebrow="CSV Profiler"
      heading="CSV profiler for fast online dataset checks."
      summary="Profile CSV files in the browser-backed playground with a DuckDB worker that surfaces schema, distributions, anomaly hints, and safe sample rows."
    />
  );
}
