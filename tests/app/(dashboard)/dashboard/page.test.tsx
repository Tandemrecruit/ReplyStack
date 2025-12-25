import { render, screen } from "@testing-library/react";

import DashboardPage, { metadata } from "@/app/(dashboard)/dashboard/page";

describe("app/(dashboard)/dashboard/page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Dashboard | Replily");
    expect(metadata.description).toBe("Manage your Google Business reviews");
  });

  it("renders the page heading", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText(
        /Welcome to Replily. Get started by connecting your Google Business Profile/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders quick stats placeholders", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Pending Reviews")).toBeInTheDocument();
    expect(screen.getByText("Responded This Week")).toBeInTheDocument();
    expect(screen.getByText("Average Rating")).toBeInTheDocument();
    // All show "—" as placeholder
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("renders getting started section", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Get Started" }),
    ).toBeInTheDocument();
  });

  it("renders onboarding steps", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText("Connect Google Business Profile"),
    ).toBeInTheDocument();
    expect(screen.getByText("Set up your voice profile")).toBeInTheDocument();
    expect(screen.getByText("Start responding to reviews")).toBeInTheDocument();
  });

  it("renders step descriptions", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText("Link your Google account to start fetching reviews"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Configure how AI responses should sound"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Generate AI responses and publish them"),
    ).toBeInTheDocument();
  });

  it("renders connect Google account link", () => {
    render(<DashboardPage />);
    const link = screen.getByRole("link", { name: "Connect Google Account" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/settings");
  });
});
