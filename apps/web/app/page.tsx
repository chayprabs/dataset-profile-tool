import { DatasetWorkspace } from "../components/dataset-workspace";
import { SeoStrip } from "../components/seo-strip";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which dataset formats can DataProfile inspect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DataProfile supports CSV, TSV, JSON, JSONL, Parquet, Arrow IPC, Avro, and SQLite sources."
      }
    },
    {
      "@type": "Question",
      name: "Can DataProfile infer JSON Schema from real data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The worker generates Draft 2020-12 JSON Schema with confidence scores, examples, and format hints based on observed values."
      }
    },
    {
      "@type": "Question",
      name: "Does DataProfile support week-over-week drift analysis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Drift mode compares two snapshots and groups changes into additive, compatible, and breaking classifications with report exports and share links."
      }
    }
  ]
};

export default function HomePage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />
      <SeoStrip />
      <main className="site-main">
        <DatasetWorkspace />
      </main>
    </>
  );
}
