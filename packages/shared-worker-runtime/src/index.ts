export interface SampleDescriptor {
  slug: string;
  label: string;
  format: string;
  description: string;
  path: string;
}

export const samples: SampleDescriptor[] = [
  {
    slug: "ecommerce-events",
    label: "Ecommerce Events (CSV)",
    format: "csv",
    description: "Baseline stats with numeric, text, bool, and timestamp columns.",
    path: "/samples/ecommerce-events.csv"
  },
  {
    slug: "weather-tsv",
    label: "Weather (TSV)",
    format: "tsv",
    description: "Tab-separated weather readings.",
    path: "/samples/weather.tsv"
  },
  {
    slug: "users-json",
    label: "Users (JSON)",
    format: "json",
    description: "JSON array of user records.",
    path: "/samples/users.json"
  },
  {
    slug: "weather-jsonl",
    label: "Weather (JSONL)",
    format: "jsonl",
    description: "Newline-delimited JSON weather rows.",
    path: "/samples/weather.jsonl"
  },
  {
    slug: "nyc-taxi-sample",
    label: "NYC Taxi (Parquet)",
    format: "parquet",
    description: "Parquet snapshot for column-statistics profiling.",
    path: "/samples/nyc-taxi-sample.parquet"
  },
  {
    slug: "sample-arrow",
    label: "Customers (Arrow IPC)",
    format: "arrow",
    description: "Arrow IPC file for zero-copy reads.",
    path: "/samples/sample.arrow"
  },
  {
    slug: "users-avro",
    label: "Users (Avro)",
    format: "avro",
    description: "Avro records converted through the fastavro path.",
    path: "/samples/users.avro"
  },
  {
    slug: "chinook-sqlite",
    label: "Chinook (SQLite)",
    format: "sqlite",
    description: "SQLite database with a customers table.",
    path: "/samples/chinook.sqlite"
  },
  {
    slug: "mixed-types",
    label: "Mixed Types",
    format: "csv",
    description: "Adversarial fixture that forces mixed-type detection.",
    path: "/samples/mixed-types.csv"
  },
  {
    slug: "pii-laden",
    label: "PII Laden",
    format: "csv",
    description: "Synthetic PII for email, phone, SSN, IBAN, and credit card detection.",
    path: "/samples/pii-laden.csv"
  },
  {
    slug: "anomaly-lab",
    label: "Anomaly Lab",
    format: "csv",
    description: "Leading zeros, mixed dates, unicode, null tokens, and entropy hints.",
    path: "/samples/anomaly-lab.csv"
  },
  {
    slug: "drift-week-1",
    label: "Drift Week 1",
    format: "csv",
    description: "Golden baseline snapshot for drift comparisons.",
    path: "/samples/drift-week-1.csv"
  },
  {
    slug: "drift-week-2",
    label: "Drift Week 2",
    format: "csv",
    description: "Golden changed snapshot for drift comparisons.",
    path: "/samples/drift-week-2.csv"
  }
];
