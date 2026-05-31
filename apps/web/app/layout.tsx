import type { Metadata } from "next";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { siteUrl } from "../lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataProfile",
  metadataBase: new URL(siteUrl),
  description:
    "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality.",
  openGraph: {
    title: "DataProfile",
    description:
      "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality.",
    images: [{ url: "/opengraph-image" }],
    url: siteUrl,
    siteName: "DataProfile",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DataProfile",
    description:
      "Profile CSV, Parquet, JSONL, Avro, and SQLite datasets online with schema inference, drift detection, anomalies, nulls, and cardinality.",
    images: ["/opengraph-image"]
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
