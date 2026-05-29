const fallbackSiteUrl =
  process.env.NODE_ENV === "production"
    ? "https://dataprofile.example.com"
    : "http://localhost:3000";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? fallbackSiteUrl;
