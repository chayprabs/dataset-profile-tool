import { FeatureLanding } from "../../components/feature-landing";

export default function ParquetProfilerPage() {
  return (
    <FeatureLanding
      bullets={[
        "Stream Parquet snapshots through DuckDB so large files stay practical to inspect.",
        "Compare week-over-week snapshots and classify additive, compatible, and breaking drift.",
        "Export HTML, Markdown, JSON, and schema artifacts for downstream review."
      ]}
      ctaHref="/"
      ctaLabel="Open Parquet Profiler"
      eyebrow="Parquet Profiler"
      heading="Parquet profiler for schema, stats, and drift."
      summary="Inspect Parquet datasets online with fast schema inference, per-column profiling, anomaly detection, and drift analysis built for data-engineering workflows."
    />
  );
}
