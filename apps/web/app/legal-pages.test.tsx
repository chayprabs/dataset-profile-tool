import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LicensePage from "./license/page";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";

describe("legal pages", () => {
  it("renders privacy policy sections", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByText(/do not sell your personal information/i)).toBeInTheDocument();
  });

  it("renders terms with liability cap", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: /Terms & Conditions/i })).toBeInTheDocument();
    expect(screen.getByText(/US \$100/i)).toBeInTheDocument();
  });

  it("renders license page with AGPL", () => {
    render(<LicensePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /License & Legal Notices/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/AGPL-3.0/i).length).toBeGreaterThan(0);
  });
});
