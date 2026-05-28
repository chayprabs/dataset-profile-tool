import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(["event_id,user_id\n1,1001"], { type: "text/csv" })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jobId: "job-1",
            source: { format: "csv", sizeBytes: 20, rowCount: 1, sha256: "hash" },
            columns: [],
            schema: { type: "object", properties: {} },
            warnings: [],
            sampleRows: [{ event_id: "1", user_id: 1001 }]
          })
        })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the primary navigation and workspace entry points", () => {
    render(<HomePage />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Drift")).toBeInTheDocument();
    expect(screen.getByText("Playground")).toBeInTheDocument();
    expect(screen.getByText("Quiet by default")).toBeInTheDocument();
  });
});
