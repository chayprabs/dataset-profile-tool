import { describe, expect, it } from "vitest";

import type { ProfileResult } from "@dataprofile/shared-types";

import { buildProfileHtml, buildProfileMarkdown } from "./profile-report";

const profile: ProfileResult = {
  jobId: "job-1",
  source: {
    format: "csv",
    rowCount: 5,
    sizeBytes: 120,
    sha256: "abc123"
  },
  columns: [
    {
      name: "customer_email",
      inferredType: "string",
      nullable: false,
      nullCount: 0,
      nullPct: 0,
      uniqueCount: 5,
      uniquePct: 100,
      topValues: [{ value: "devika@example.com", count: 1 }],
      piiFlags: ["email"],
      anomalies: [],
      confidence: 0.98,
      string: { minLen: 15, maxLen: 18, charClasses: { lower: 10 } }
    }
  ],
  schema: { type: "object" },
  warnings: ["sample warning"],
  sampleRows: [{ customer_email: "devika@example.com" }]
};

describe("profile report exporters", () => {
  it("builds markdown output", () => {
    const markdown = buildProfileMarkdown(profile);
    expect(markdown).toContain("# DataProfile Report");
    expect(markdown).toContain("sample warning");
    expect(markdown).toContain("customer_email");
  });

  it("builds html output", () => {
    const html = buildProfileHtml(profile);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("DataProfile Report");
    expect(html).toContain("customer_email");
  });
});
