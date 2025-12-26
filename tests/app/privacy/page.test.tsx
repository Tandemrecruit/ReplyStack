import { render, screen } from "@testing-library/react";

import PrivacyPage, { metadata } from "@/app/privacy/page";

describe("app/privacy/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Privacy Policy | Replily");
    expect(metadata.description).toBe(
      "How Replily handles your data and privacy.",
    );
  });

  it("renders header with logo", () => {
    render(<PrivacyPage />);
    const logoLink = screen.getByRole("link", { name: "Replily" });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders header navigation links", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: /join waitlist/i }),
    ).toHaveAttribute("href", "/#waitlist");
  });

  it("renders page heading", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
  });

  it("renders introduction text", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(
        /This is a plain-language summary of how Replily handles data/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders contact email link", () => {
    render(<PrivacyPage />);
    const emailLinks = screen.getAllByRole("link", {
      name: "support@replily.com",
    });
    expect(emailLinks.length).toBeGreaterThan(0);
    emailLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "mailto:support@replily.com");
    });
  });

  it("renders all policy sections", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { name: "What we collect" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How we use it" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Data sharing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Security" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contact" }),
    ).toBeInTheDocument();
  });

  it("renders section content", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(/Account info \(email, organization details\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Business Profile data you connect/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/To draft review replies in your preferred voice/i),
    ).toBeInTheDocument();
  });

  it("renders last updated date", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });
});
