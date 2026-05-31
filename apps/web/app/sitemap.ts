import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/drift",
    "/privacy",
    "/terms",
    "/license",
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
