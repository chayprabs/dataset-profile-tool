import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataProfile",
  description:
    "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality."
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
