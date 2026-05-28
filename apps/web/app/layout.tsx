import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://data-profile.standalone-tool-portfolio.local";

export const metadata: Metadata = {
  title: "DataProfile",
  metadataBase: new URL(siteUrl),
  description:
    "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality.",
  openGraph: {
    title: "DataProfile",
    description:
      "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality.",
    url: siteUrl,
    siteName: "DataProfile",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DataProfile",
    description:
      "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality."
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
