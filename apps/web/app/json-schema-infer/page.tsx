import { FeatureLanding } from "../../components/feature-landing";

export default function JsonSchemaInferPage() {
  return (
    <FeatureLanding
      bullets={[
        "Infer Draft 2020-12 JSON Schema from CSV, Parquet, JSONL, Avro, Arrow IPC, and SQLite sources.",
        "Capture examples, low-cardinality enums, confidence scores, and safe format metadata.",
        "Download `.schema.json` output directly from the main profiling workflow."
      ]}
      ctaHref="/"
      ctaLabel="Open Schema Inference"
      eyebrow="JSON Schema Inference"
      heading="JSON Schema inference for real dataset snapshots."
      summary="Turn real-world datasets into validation-ready JSON Schema documents with confidence scores, examples, and practical format detection."
    />
  );
}
