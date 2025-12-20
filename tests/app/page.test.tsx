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

  it("renders hero badge", () => {
    render(<LandingPage />);
    expect(screen.getByText(/built for local businesses/i)).toBeInTheDocument();
  });

  it("renders hero gradient text", () => {
    render(<LandingPage />);
    expect(screen.getByText(/30 seconds/i)).toBeInTheDocument();
  });

  it("renders hero social proof avatars", () => {
    render(<LandingPage />);
    expect(screen.getByText(/140\+ local owners/i)).toBeInTheDocument();
  });

  it("renders hero visual card", () => {
    render(<LandingPage />);
    expect(screen.getByText("Green Bistro")).toBeInTheDocument();
    expect(screen.getByText(/Austin, TX/i)).toBeInTheDocument();
    expect(screen.getByText(/New review/i)).toBeInTheDocument();
  });

  it("renders hero review content", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Best pizza in Austin/i)).toBeInTheDocument();
    expect(screen.getByText(/Sarah M\./i)).toBeInTheDocument();
  });

  it("renders hero draft reply", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Draft reply/i)).toBeInTheDocument();
    expect(screen.getByText(/Owner tone/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sarah, thanks for the kind words/i),
    ).toBeInTheDocument();
  });

  it("renders hero action buttons", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("button", { name: /publish/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit reply/i }),
    ).toBeInTheDocument();
  });

  it("renders social proof business names", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Maria's Corner Bakery/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Chen Family Dental/i)).toBeInTheDocument();
    expect(screen.getByText(/QuickFix HVAC/i)).toBeInTheDocument();
  });

  it("renders feature step descriptions", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Link your Google Business Profile/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We learn from your past replies/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Generate, tweak, and publish/i),
    ).toBeInTheDocument();
  });

  it("renders benefits list items", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Save 10\+ hours per week/i)).toBeInTheDocument();
    expect(screen.getByText(/100% response rate/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Replies that sound owner-written/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Defuse tough reviews/i)).toBeInTheDocument();
  });

  it("renders proof point cards", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Avg\. response time/i)).toBeInTheDocument();
    expect(screen.getByText("27 sec")).toBeInTheDocument();
    // "Response rate" appears in both benefits and proof point cards
    expect(screen.getAllByText(/Response rate/i).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/Tone match score/i)).toBeInTheDocument();
    expect(screen.getByText("96/100")).toBeInTheDocument();
    expect(screen.getByText(/Hours saved weekly/i)).toBeInTheDocument();
    expect(screen.getByText("10+")).toBeInTheDocument();
  });

  it("renders pricing description", () => {
    render(<LandingPage />);
    expect(screen.getByText(/One plan, all features/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Best for single-location shops/i),
    ).toBeInTheDocument();
  });

  it("renders pricing plan badge", () => {
    render(<LandingPage />);
    expect(screen.getByText("PRO PLAN")).toBeInTheDocument();
  });

  it("renders pricing CTA link", () => {
    render(<LandingPage />);
    const pricingCta = screen.getAllByRole("link", {
      name: /start 14-day free trial/i,
    });
    expect(pricingCta.length).toBeGreaterThanOrEqual(2);
    expect(
      pricingCta.some((link) => link.getAttribute("href") === "/signup"),
    ).toBe(true);
  });

  it("renders pricing FAQ link", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: /pricing faq/i })).toHaveAttribute(
      "href",
      "/pricing-faq",
    );
  });

  it("renders CTA section links", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("link", { name: /start your free trial/i }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /view the app/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders footer copyright year", () => {
    render(<LandingPage />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${currentYear} ReplyStack`)),
    ).toBeInTheDocument();
  });

  it("renders footer help link", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("link", { name: /need help choosing/i }),
    ).toHaveAttribute(
      "href",
      "mailto:support@replystack.com?subject=Help%20choosing%20a%20plan",
    );
  });

  it("renders no credit card message", () => {
    render(<LandingPage />);
    // "No credit card required" appears in both hero and pricing sections
    expect(
      screen.getAllByText(/No credit card required/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Cancel anytime/i)).toBeInTheDocument();
  });
});
