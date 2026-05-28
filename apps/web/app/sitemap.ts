import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://data-profile.standalone-tool-portfolio.local";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/drift",
    "/csv-profiler",
    "/parquet-profiler",
    "/jsonl-profiler",
    "/json-schema-infer",
    "/dataset-drift"
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
