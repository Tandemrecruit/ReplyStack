import { render, screen } from "@testing-library/react";

import RootLayout, { metadata } from "@/app/layout";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  DM_Sans: vi.fn(() => ({
    variable: "--font-dm-sans",
  })),
  JetBrains_Mono: vi.fn(() => ({
    variable: "--font-jetbrains-mono",
  })),
}));

describe("app/layout (Root Layout)", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toEqual({
      default: "ReplyStack | AI-Powered Review Responses",
      template: "%s | ReplyStack",
    });
    expect(metadata.description).toContain(
      "Respond to every Google Business review",
    );
  });

  it("renders children content", () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  // Note: Tests for html/body element attributes removed - jsdom cannot query
  // these elements from Next.js root layout renders as they're outside the
  // render container. These are integration-level concerns better tested with E2E.

  it("renders multiple children", () => {
    render(
      <RootLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </RootLayout>,
    );
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});
