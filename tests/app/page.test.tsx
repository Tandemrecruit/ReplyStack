import { render, screen } from "@testing-library/react";

import LandingPage, { metadata } from "@/app/page";

// Mock the LiveDemo component
vi.mock("@/components/landing/live-demo", () => ({
  LiveDemo: () => <div data-testid="live-demo">LiveDemo</div>,
}));

describe("app/page (Landing Page)", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe(
      "ReplyStack | AI-Powered Review Responses for Local Businesses",
    );
    expect(metadata.description).toContain(
      "Respond to every Google Business review",
    );
  });

  it("renders navigation bar", () => {
    render(<LandingPage />);
    // Accessible name includes icon text "R" + "ReplyStack"
    const logoLink = screen.getByRole("link", { name: /R\s*ReplyStack/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders sign in link", () => {
    render(<LandingPage />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("renders start free trial button", () => {
    render(<LandingPage />);
    const trialButton = screen.getByRole("link", { name: /start free trial/i });
    expect(trialButton).toHaveAttribute("href", "/signup");
  });

  it("renders hero section heading", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        name: /respond to every review in 30 seconds/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders hero section description", () => {
    render(<LandingPage />);
    // Text contains em-dash and spans multiple lines in JSX
    expect(screen.getByText(/Owner-quality replies/i)).toBeInTheDocument();
  });

  it("renders CTA buttons in hero", () => {
    render(<LandingPage />);
    // Multiple "Start 14-Day Free Trial" links exist (hero + pricing)
    const trialLinks = screen.getAllByRole("link", {
      name: /start 14-day free trial/i,
    });
    expect(trialLinks.length).toBeGreaterThanOrEqual(1);
    expect(trialLinks[0]).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: /see how it works/i }),
    ).toHaveAttribute("href", "#how-it-works");
    expect(
      screen.getByRole("link", { name: /see a live example/i }),
    ).toHaveAttribute("href", "#live-demo");
  });

  it("renders LiveDemo component", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("live-demo")).toBeInTheDocument();
  });

  it("renders social proof section", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/trusted by local businesses/i),
    ).toBeInTheDocument();
  });

  it("renders how it works section", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: "How ReplyStack Works" }),
    ).toBeInTheDocument();
  });

  it("renders feature steps", () => {
    render(<LandingPage />);
    expect(screen.getByText("Connect Google")).toBeInTheDocument();
    expect(screen.getByText("Set Your Voice")).toBeInTheDocument();
    expect(screen.getByText("Respond Instantly")).toBeInTheDocument();
  });

  it("renders benefits section", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        name: /stop ignoring reviews/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders pricing section", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: "Simple, Transparent Pricing" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("renders pricing features", () => {
    render(<LandingPage />);
    expect(screen.getByText("Unlimited AI responses")).toBeInTheDocument();
    expect(screen.getByText("1 business location")).toBeInTheDocument();
    expect(screen.getByText("Email notifications")).toBeInTheDocument();
    expect(screen.getByText("Custom voice profile")).toBeInTheDocument();
    expect(screen.getByText("Priority support")).toBeInTheDocument();
  });

  it("renders CTA section", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        name: /ready to transform your review management/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  it("renders footer contact link", () => {
    render(<LandingPage />);
    const contactLink = screen.getByRole("link", { name: "Contact" });
    expect(contactLink).toHaveAttribute(
      "href",
      "mailto:support@replystack.com",
    );
  });
});
