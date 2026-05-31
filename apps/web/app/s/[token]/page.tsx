import type { DriftResult, ProfileResult } from "@dataprofile/shared-types";

import { SharedDriftReport, SharedProfileReport } from "../../../components/shared-report-view";

type SharedPayload = {
  kind: "profile" | "drift";
  payload: ProfileResult | DriftResult;
  expiresAt: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await fetch(`${apiBaseUrl}/v1/share/${token}`, { cache: "no-store" });

  if (!response.ok) {
    return (
      <main className="site-main legal-page">
        <h1>Link unavailable</h1>
        <p style={{ color: "var(--muted)" }}>
          This shared report may have expired or never existed.
        </p>
      </main>
    );
  }

  const shared = (await response.json()) as SharedPayload;

  return (
    <main className="site-main">
      <div className="workspace-card" style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Shared DataProfile report</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.35rem" }}>
          Expires {new Date(shared.expiresAt).toLocaleString()}
        </p>
      </div>
      {shared.kind === "profile" ? (
        <SharedProfileReport profile={shared.payload as ProfileResult} />
      ) : (
        <SharedDriftReport apiBaseUrl={apiBaseUrl} drift={shared.payload as DriftResult} />
      )}
    </main>
  );
}
