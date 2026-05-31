import { describe, expect, it } from "vitest";

import {
  buildPiiColumnSet,
  redactSampleRows,
  redactSchema,
  shouldRedactSampleKey
} from "./pii-columns";

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

  it("redacts schema examples for flagged properties", () => {
    const schema = redactSchema(
      {
        type: "object",
        properties: {
          customer_email: {
            type: "string",
            examples: ["secret@example.com"]
          }
        }
      },
      [
        {
          name: "customer_email",
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
      ]
    );
    const property = (schema.properties as Record<string, { examples: string[] }>).customer_email;
    expect(property.examples[0]).toContain("[redacted]");
  });
});
