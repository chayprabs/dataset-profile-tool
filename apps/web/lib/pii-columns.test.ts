import { describe, expect, it } from "vitest";

import { buildPiiColumnSet, redactSampleRows, shouldRedactSampleKey } from "./pii-columns";

describe("pii-columns", () => {
  it("matches sqlite prefixed columns to bare sample keys", () => {
    const piiColumns = buildPiiColumnSet([
      {
        name: "customers.customer_email",
        inferredType: "string",
        nullable: false,
        nullCount: 0,
        nullPct: 0,
        uniqueCount: 1,
        uniquePct: 100,
        topValues: [],
        piiFlags: ["email"],
        anomalies: [],
        confidence: 1
      }
    ]);
    expect(shouldRedactSampleKey("customer_email", piiColumns)).toBe(true);
    const rows = redactSampleRows([{ customer_email: "devika@example.com" }], piiColumns);
    expect(String(rows[0].customer_email)).toContain("[redacted]");
  });
});
