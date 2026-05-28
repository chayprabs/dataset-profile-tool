import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://data-profile.standalone-tool-portfolio.local";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
