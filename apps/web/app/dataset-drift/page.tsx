import { FeatureLanding } from "../../components/feature-landing";

export default function DatasetDriftPage() {
  return (
    <FeatureLanding
      bullets={[
        "Compare two snapshots from files, URLs, or golden fixtures and classify additive, compatible, and breaking changes.",
        "Export HTML, Markdown, and JSON drift reports or create a read-only share link.",
        "Review change-level patch hints for the breaking paths that matter most."
      ]}
      ctaHref="/drift"
      ctaLabel="Open Dataset Drift"
      eyebrow="Dataset Drift"
      heading="Dataset drift reports for schema and distribution changes."
      summary="Detect week-over-week drift across vendor extracts and internal snapshots with worker-backed comparison, severity grouping, and shareable report output."
    />
  );
}
