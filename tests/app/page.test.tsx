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
    expect(metadata.description).toContain("Get AI-generated review responses");
  });

  it("renders navigation with all key links", () => {
    render(<LandingPage />);
    // Logo link
    const logoLink = screen.getByRole("link", { name: /R\s*ReplyStack/i });
    expect(logoLink).toHaveAttribute("href", "/");

    // Auth links
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: /start free trial/i }),
    ).toHaveAttribute("href", "/signup");
  });

  it("renders complete hero section with all elements", () => {
    render(<LandingPage />);

    // Structural elements
    expect(
      screen.getByRole("heading", { name: /respond to every review/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Owner-quality replies/i)).toBeInTheDocument();
    expect(screen.getByText(/built for local businesses/i)).toBeInTheDocument();

    // Key CTAs
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

    // Social proof
    expect(screen.getByText(/\d+\+ local owners/i)).toBeInTheDocument();

    // Hero visual card elements (structural check)
    expect(screen.getByText(/New review/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /publish/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit reply/i }),
    ).toBeInTheDocument();

    // Trust indicators (appears in multiple places)
    expect(
      screen.getAllByText(/No credit card required/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Cancel anytime/i)).toBeInTheDocument();
  });

  it("renders LiveDemo component", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("live-demo")).toBeInTheDocument();
  });

  it("renders social proof section with business names", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/trusted by local businesses/i),
    ).toBeInTheDocument();
    // Check for at least one business name (flexible matching - use getAllByText since "dental" also appears in hero)
    const businessNames = screen.getAllByText(
      /Maria's Corner Bakery|Dr\. Chen Family Dental|QuickFix HVAC/i,
    );
    expect(businessNames.length).toBeGreaterThanOrEqual(1);
  });

  it("renders how it works section with all feature steps", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /how replystack works/i }),
    ).toBeInTheDocument();

    // Feature step titles
    expect(screen.getByText(/Connect Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Your Voice/i)).toBeInTheDocument();
    expect(screen.getByText(/Respond Instantly/i)).toBeInTheDocument();

    // Feature descriptions (flexible matching)
    expect(screen.getByText(/Google Business Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/past replies|tone quiz/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Generate, tweak, and publish/i),
    ).toBeInTheDocument();
  });

  it("renders benefits section with key value propositions", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /stop ignoring reviews/i }),
    ).toBeInTheDocument();

    // Benefits list items (flexible matching)
    expect(screen.getByText(/Save.*hours per week/i)).toBeInTheDocument();
    expect(screen.getByText(/100%.*response rate/i)).toBeInTheDocument();
    // "sound owner-written" appears in multiple places, use getAllByText
    expect(
      screen.getAllByText(/sound owner-written|tone locked/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Defuse.*reviews/i)).toBeInTheDocument();

    // Proof point cards (structural check - multiple cards exist)
    expect(
      screen.getAllByText(
        /Avg\. response time|Response rate|Tone match score|Hours saved weekly/i,
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders pricing section with plan details and CTAs", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /Simple.*Pricing/i }),
    ).toBeInTheDocument();

    // Pricing amount (flexible matching)
    expect(screen.getByText(/\$\d+/)).toBeInTheDocument();
    expect(screen.getByText(/\/month/i)).toBeInTheDocument();

    // Plan badge
    expect(screen.getByText(/PRO PLAN/i)).toBeInTheDocument();

    // Pricing features (check for key features, not exact wording)
    expect(
      screen.getByText(/Unlimited.*responses|AI responses/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/^1 business location$/i)).toBeInTheDocument();
    expect(screen.getByText(/voice profile|Custom voice/i)).toBeInTheDocument();
    expect(screen.getByText(/^Email notifications$/i)).toBeInTheDocument();
    expect(screen.getByText(/support|Priority/i)).toBeInTheDocument();

    // Pricing CTAs
    const pricingCta = screen.getAllByRole("link", {
      name: /start 14-day free trial/i,
    });
    expect(pricingCta.length).toBeGreaterThanOrEqual(2);
    expect(
      pricingCta.some((link) => link.getAttribute("href") === "/signup"),
    ).toBe(true);

    // Pricing FAQ link
    expect(screen.getByRole("link", { name: /pricing faq/i })).toHaveAttribute(
      "href",
      "/pricing-faq",
    );

    // Trust indicators (appears in multiple places)
    expect(
      screen.getAllByText(/No credit card required/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders CTA section with conversion links", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        name: /ready to transform|review management/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /start your free trial/i }),
    ).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /view the app/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders footer with all links and copyright", () => {
    render(<LandingPage />);

    // Footer links
    expect(screen.getByRole("link", { name: /Privacy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: /Terms/i })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: /Contact/i })).toHaveAttribute(
      "href",
      "mailto:support@replystack.com",
    );
    expect(
      screen.getByRole("link", { name: /need help choosing/i }),
    ).toHaveAttribute(
      "href",
      "mailto:support@replystack.com?subject=Help%20choosing%20a%20plan",
    );

    // Copyright
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${currentYear} ReplyStack`)),
    ).toBeInTheDocument();
  });
});
