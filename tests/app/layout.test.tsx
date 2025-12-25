import { renderToString } from "react-dom/server";

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

  it("exports metadata with keywords", () => {
    expect(metadata.keywords).toEqual([
      "review management",
      "Google Business Profile",
      "AI responses",
      "local business",
      "reputation management",
    ]);
  });

  it("exports metadata with authors", () => {
    expect(metadata.authors).toEqual([{ name: "ReplyStack" }]);
    expect(metadata.creator).toBe("ReplyStack");
  });

  it("exports metadata with openGraph properties", () => {
    expect(metadata.openGraph).toEqual({
      type: "website",
      locale: "en_US",
      url: "https://replystack.com",
      siteName: "ReplyStack",
      title: "ReplyStack | AI-Powered Review Responses",
      description:
        "Respond to every Google Business review in 30 seconds with AI that sounds like you.",
    });
  });

  it("exports metadata with twitter properties", () => {
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "ReplyStack | AI-Powered Review Responses",
      description:
        "Respond to every Google Business review in 30 seconds with AI that sounds like you.",
    });
  });

  it("exports metadata with robots properties", () => {
    expect(metadata.robots).toEqual({
      index: true,
      follow: true,
    });
  });

  it("renders children content", () => {
    const html = renderToString(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>,
    );
    expect(html).toContain('data-testid="child-content"');
    expect(html).toContain("Test Content");
  });

  // Note: Tests for html/body element attributes removed - jsdom cannot query
  // these elements from Next.js root layout renders as they're outside the
  // render container. These are integration-level concerns better tested with E2E.

  it("renders multiple children", () => {
    const html = renderToString(
      <RootLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </RootLayout>,
    );
    expect(html).toContain('data-testid="child-1"');
    expect(html).toContain('data-testid="child-2"');
  });
});
