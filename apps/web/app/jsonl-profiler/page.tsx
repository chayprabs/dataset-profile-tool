import { FeatureLanding } from "../../components/feature-landing";

export default function JsonlProfilerPage() {
  return (
    <FeatureLanding
      bullets={[
        "Handle newline-delimited JSON feeds with per-column stats, null rates, uniqueness, and format hints.",
        "Validate inferred schema output against real rows with the same AJV-safe conventions used in the app.",
        "Flag suspicious PII columns and redact displayed sample values by default."
      ]}
      ctaHref="/"
      ctaLabel="Open JSONL Profiler"
      eyebrow="JSONL Profiler"
      heading="JSONL profiler for contracts, nulls, and anomalies."
      summary="Profile JSONL and JSON datasets online to understand field coverage, inferred types, example values, and validation-ready schema output."
    />
  );
}
