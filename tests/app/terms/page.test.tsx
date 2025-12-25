import { render, screen } from "@testing-library/react";

import TermsPage, { metadata } from "@/app/terms/page";

describe("app/terms/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Terms of Service | Replily");
    expect(metadata.description).toContain("Terms and conditions");
  });

  it("renders page heading", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: "Terms of Service" }),
    ).toBeInTheDocument();
  });

  it("renders last updated date", () => {
    render(<TermsPage />);
    expect(
      screen.getByText(/Last updated: December 16, 2025/i),
    ).toBeInTheDocument();
  });

  it("renders introduction paragraph", () => {
    render(<TermsPage />);
    expect(
      screen.getByText(
        /These Terms of Service \("Terms"\) govern your access/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders all numbered sections", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: "1. Eligibility" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "2. Your Account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "3. Acceptable Use" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "4. Intellectual Property" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "5. Billing & Cancellation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "6. Termination" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "7. Disclaimers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "8. Limitation of Liability" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "9. Changes to These Terms" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "10. Contact" }),
    ).toBeInTheDocument();
  });

  it("renders section content", () => {
    render(<TermsPage />);
    expect(
      screen.getByText(/You must be 18 years or older/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You are responsible for maintaining/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Use the Service for any unlawful purpose/i),
    ).toBeInTheDocument();
  });

  it("renders contact email link", () => {
    render(<TermsPage />);
    const emailLink = screen.getByRole("link", {
      name: "support@replily.com",
    });
    expect(emailLink).toHaveAttribute("href", "mailto:support@replily.com");
  });

  it("uses semantic article element", () => {
    const { container } = render(<TermsPage />);
    const article = container.querySelector("article");
    expect(article).toBeInTheDocument();
  });
});
