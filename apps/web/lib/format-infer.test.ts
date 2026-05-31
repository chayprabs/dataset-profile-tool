import { describe, expect, it } from "vitest";

import { inferFormatFromName } from "./format-infer";

describe("inferFormatFromName", () => {
  it("reads format from URL path without query string", () => {
    expect(inferFormatFromName("https://cdn.example.com/data/file.parquet?token=abc")).toBe("parquet");
  });

  it("does not treat .mdb as sqlite", () => {
    expect(inferFormatFromName("https://example.com/archive.mdb")).toBeNull();
  });

  it("detects sqlite from .db suffix", () => {
    expect(inferFormatFromName("/uploads/warehouse.db")).toBe("sqlite");
  });
});
