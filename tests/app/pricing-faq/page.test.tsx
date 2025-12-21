import { render, screen } from "@testing-library/react";

import PricingFAQPage, { metadata } from "@/app/pricing-faq/page";

describe("app/pricing-faq/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Pricing FAQ | ReplyStack");
    expect(metadata.description).toContain("Answers to common questions");
  });

  it("renders page heading", () => {
    render(<PricingFAQPage />);
    expect(
      screen.getByRole("heading", { name: "Pricing FAQ" }),
    ).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<PricingFAQPage />);
    expect(
      screen.getByText(
        "Quick answers to the most common questions about billing and features.",
      ),
    ).toBeInTheDocument();
  });

  it("renders all FAQ items", () => {
    render(<PricingFAQPage />);
    expect(screen.getByText("How long is the free trial?")).toBeInTheDocument();
    expect(
      screen.getByText("What happens after the trial?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Can I add multiple locations?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Is there a limit on AI responses?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Can I cancel anytime?")).toBeInTheDocument();
    expect(
      screen.getByText("Do you offer annual billing?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("What payment methods do you accept?"),
    ).toBeInTheDocument();
  });

  it("renders FAQ answers", () => {
    render(<PricingFAQPage />);
    expect(
      screen.getByText(/14 days—no credit card required/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You'll be prompted to subscribe at \$49\/month/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Not yet. The current plan supports/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No. Generate as many drafts as you need/i),
    ).toBeInTheDocument();
  });

  it("renders contact section", () => {
    render(<PricingFAQPage />);
    expect(screen.getByText(/Still have questions\?/i)).toBeInTheDocument();
    const emailLink = screen.getByRole("link", { name: "Email us" });
    expect(emailLink).toHaveAttribute("href", "mailto:support@replystack.com");
  });

  it("uses semantic HTML for FAQ list", () => {
    const { container } = render(<PricingFAQPage />);
    const dl = container.querySelector("dl");
    expect(dl).toBeInTheDocument();
    const dtElements = container.querySelectorAll("dt");
    expect(dtElements.length).toBeGreaterThan(0);
    const ddElements = container.querySelectorAll("dd");
    expect(ddElements.length).toBeGreaterThan(0);
  });
});
