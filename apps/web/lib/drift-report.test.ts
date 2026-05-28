import { describe, expect, it } from "vitest";

import type { DriftResult } from "@dataprofile/shared-types";

import { buildDriftHtml, buildDriftMarkdown } from "./drift-report";

const fixture: DriftResult = {
  added: ["lifecycle_stage"],
  removed: ["legacy_code"],
  typeChanges: [],
  rangeChanges: [],
  cardinalityChanges: [],
  changes: [
    {
      kind: "added",
      column: "lifecycle_stage",
      severity: "additive",
      message: "Column added in latest snapshot.",
      after: "string"
    },
    {
      kind: "removed",
      column: "legacy_code",
      severity: "breaking",
      message: "Column removed from latest snapshot.",
      before: "string"
    }
  ]
};

describe("drift report builders", () => {
  it("renders markdown summary", () => {
    const output = buildDriftMarkdown(fixture);

    expect(output).toContain("# DataProfile Drift Report");
    expect(output).toContain("Total changes: 2");
    expect(output).toContain("legacy_code");
  });

  it("renders html table", () => {
    const output = buildDriftHtml(fixture);

    expect(output).toContain("<title>DataProfile Drift Report</title>");
    expect(output).toContain("lifecycle_stage");
    expect(output).toContain("breaking");
  });
});
