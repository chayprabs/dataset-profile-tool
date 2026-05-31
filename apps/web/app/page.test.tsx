import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the workspace and SEO strip", () => {
    render(<HomePage />);
    expect(screen.getByText(/Profile CSV, Parquet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run profile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Compare drift/i })).toBeInTheDocument();
  });
});
