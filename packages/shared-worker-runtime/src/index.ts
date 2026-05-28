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
    label: "Ecommerce Events",
    format: "csv",
    description: "Baseline stats fixture with numeric, text, bool, and timestamp columns.",
    path: "/samples/ecommerce-events.csv"
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
    description: "Synthetic PII fixture for email, phone, SSN, IBAN, and credit card detection.",
    path: "/samples/pii-laden.csv"
  },
  {
    slug: "anomaly-lab",
    label: "Anomaly Lab",
    format: "csv",
    description: "Adversarial fixture that trips leading zero, mixed date, unicode, null token, and entropy hints.",
    path: "/samples/anomaly-lab.csv"
  },
  {
    slug: "drift-week-1",
    label: "Drift Week 1",
    format: "csv",
    description: "Golden fixture for baseline drift comparisons.",
    path: "/samples/drift-week-1.csv"
  }
];
