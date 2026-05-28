import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the required tab labels", () => {
    render(<HomePage />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Schema")).toBeInTheDocument();
    expect(screen.getByText("Drift")).toBeInTheDocument();
  });
});
