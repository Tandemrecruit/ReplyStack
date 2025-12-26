import { render, screen } from "@testing-library/react";

import LandingPage, { metadata } from "@/app/page";

// Mock the LiveDemo component
vi.mock("@/components/landing/live-demo", () => ({
  LiveDemo: () => <div data-testid="live-demo">LiveDemo</div>,
}));

describe("app/page (Landing Page)", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe(
      "Replily | AI-Powered Review Responses for Local Businesses",
    );
    expect(metadata.description).toContain("Get AI-generated review responses");
  });

  it("renders navigation with all key links", () => {
    render(<LandingPage />);
    // Logo link
    const logoLink = screen.getByRole("link", { name: /R\s*Replily/i });
    expect(logoLink).toHaveAttribute("href", "/");

    // Auth links
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    // Multiple waitlist links exist on page, check the first one (in nav)
    const waitlistLinks = screen.getAllByRole("link", {
      name: /join waitlist/i,
    });
    expect(waitlistLinks[0]).toHaveAttribute("href", "#waitlist");
  });

  it("renders complete hero section with all elements", () => {
    render(<LandingPage />);

    // Structural elements
    expect(
      screen.getByRole("heading", { name: /respond to every review/i }),
    ).toBeInTheDocument();
    const heroDescription = screen.getByText(/Owner-quality replies/i);
    expect(heroDescription).toBeInTheDocument();
    // Verify target audience is mentioned in hero description (flexible to copy changes)
    const descriptionText = heroDescription.textContent || "";
    expect(descriptionText).toMatch(
      /(restaurants|dental|service shops|local businesses)/i,
    );

    // Key CTAs
    const waitlistLinks = screen.getAllByRole("link", {
      name: /join waitlist/i,
    });
    expect(waitlistLinks.length).toBeGreaterThanOrEqual(1);
    expect(waitlistLinks[0]).toHaveAttribute("href", "#waitlist");
    expect(
      screen.getByRole("link", { name: /see how it works/i }),
    ).toHaveAttribute("href", "#how-it-works");
    expect(
      screen.getByRole("link", { name: /see a live example/i }),
    ).toHaveAttribute("href", "#live-demo");

    // Hero visual card elements (structural check)
    expect(screen.getByText(/New review/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /publish/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit reply/i }),
    ).toBeInTheDocument();

    // Trust indicators
    expect(
      screen.getByText(/Be the first to know when we launch/i),
    ).toBeInTheDocument();
  });

  it("renders LiveDemo component", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("live-demo")).toBeInTheDocument();
  });

  it("renders how it works section with all feature steps", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /how replily works/i }),
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

    // Proof point cards (detection time and hours saved)
    expect(screen.getByText(/Avg\. detection time/i)).toBeInTheDocument();
    expect(screen.getByText(/Hours saved weekly/i)).toBeInTheDocument();
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
      name: /join waitlist/i,
    });
    expect(pricingCta.length).toBeGreaterThanOrEqual(2);
    expect(
      pricingCta.some((link) => link.getAttribute("href") === "#waitlist"),
    ).toBe(true);

    // Pricing FAQ link
    expect(screen.getByRole("link", { name: /pricing faq/i })).toHaveAttribute(
      "href",
      "/pricing-faq",
    );

    // Trust indicator in pricing section
    expect(
      screen.getByText(/Be first to try when we launch/i),
    ).toBeInTheDocument();
  });

  it("renders CTA section with conversion links", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        name: /ready to transform|review management/i,
      }),
    ).toBeInTheDocument();

    // All "Join Waitlist" links point to #waitlist
    const waitlistLinks = screen.getAllByRole("link", {
      name: /join waitlist/i,
    });
    expect(waitlistLinks.length).toBeGreaterThanOrEqual(1);
    expect(
      waitlistLinks.every((link) => link.getAttribute("href") === "#waitlist"),
    ).toBe(true);
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
      "mailto:support@replily.com",
    );
    expect(
      screen.getByRole("link", { name: /need help choosing/i }),
    ).toHaveAttribute(
      "href",
      "mailto:support@replily.com?subject=Help%20choosing%20a%20plan",
    );

    // Copyright
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${currentYear} Replily`)),
    ).toBeInTheDocument();
  });
});
