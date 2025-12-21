import { render, screen } from "@testing-library/react";

vi.mock("@/lib/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/reviews"),
}));

import ReviewsPage, { metadata } from "@/app/(dashboard)/reviews/page";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Creates a mock Supabase client for the reviews page tests.
 * Returns a client that simulates a user with an organization but no locations/reviews.
 */
function createMockSupabaseClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "user-1", organization_id: "org-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };
    }),
  } as never;
}

describe("app/(dashboard)/reviews/page", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Reviews | ReplyStack");
    expect(metadata.description).toBe(
      "View and respond to your Google Business reviews",
    );
  });

  it("renders the page heading", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );

    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    expect(
      screen.getByRole("heading", { name: "Reviews" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );

    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    expect(
      screen.getByText("View and respond to your Google Business reviews"),
    ).toBeInTheDocument();
  });

  it("renders rating filter dropdown", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );

    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    const ratingSelect = screen.getByRole("combobox", {
      name: /filter by rating/i,
    });
    expect(ratingSelect).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "All Ratings" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "5 Stars" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1 Star" })).toBeInTheDocument();
  });

  it("renders status filter dropdown", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );

    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    const statusSelect = screen.getByRole("combobox", {
      name: /filter by status/i,
    });
    expect(statusSelect).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "All Status" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Responded" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ignored" })).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );

    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    expect(
      screen.getByRole("heading", { name: "No reviews yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect your Google Business Profile to start seeing reviews here.",
      ),
    ).toBeInTheDocument();
  });

  it("renders empty state icon", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );

    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    const icon = screen.getByRole("img", {
      name: "No reviews icon",
    });
    expect(icon).toBeInTheDocument();
  });
});
