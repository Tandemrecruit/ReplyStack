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

// Mock HTMLDialogElement methods (not implemented in jsdom)
// Required for ResponseEditModal component used in GenerateResponseButton
HTMLDialogElement.prototype.showModal = vi.fn(function (
  this: HTMLDialogElement,
) {
  this.setAttribute("open", "");
});
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute("open");
});

import ReviewsPage, { metadata } from "@/app/(dashboard)/reviews/page";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Options for creating a mock Supabase client
 */
interface MockClientOptions {
  user?: { id: string } | null;
  userData?: { id: string; organization_id: string | null } | null;
  userError?: Error | null;
  locations?: Array<{ id: string }> | null;
  locationsError?: Error | null;
  reviews?: Array<unknown> | null;
  reviewsError?: Error | null;
}

/**
 * Creates a mock Supabase client for the reviews page tests.
 * Supports various scenarios through options parameter.
 */
function createMockSupabaseClient(options: MockClientOptions = {}) {
  const {
    user = { id: "user-1" },
    userData = { id: "user-1", organization_id: "org-1" },
    userError = null,
    locations = [],
    locationsError = null,
    reviews = [],
    reviewsError = null,
  } = options;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: userData,
                error: userError,
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
                data: locations,
                error: locationsError,
              }),
            }),
          }),
        };
      }
      if (table === "reviews") {
        // Create a real Promise that resolves with the query result
        const promise = Promise.resolve({
          data: reviews,
          error: reviewsError,
        });
        // Create an object with chainable query builder methods
        const mockQuery = {
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
        };
        // Attach Promise methods that delegate to the underlying Promise
        Object.assign(mockQuery, {
          then: promise.then.bind(promise),
          catch: promise.catch.bind(promise),
          finally: promise.finally.bind(promise),
        });
        return {
          select: vi.fn().mockReturnValue(mockQuery),
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
  beforeEach(() => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      createMockSupabaseClient(),
    );
  });

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
    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    expect(
      screen.getByRole("heading", { name: "Reviews" }),
    ).toBeInTheDocument();
  });

  it("renders the page description", async () => {
    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    expect(
      screen.getByText("View and respond to your Google Business reviews"),
    ).toBeInTheDocument();
  });

  it("renders rating filter dropdown", async () => {
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
    const Component = await ReviewsPage({ searchParams: {} });
    render(Component);
    const icon = screen.getByRole("img", {
      name: "No reviews icon",
    });
    expect(icon).toBeInTheDocument();
  });

  describe("user with locations but no reviews", () => {
    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          locations: [{ id: "loc-1" }, { id: "loc-2" }],
          reviews: [],
        }),
      );
    });

    it("renders empty state with filters visible", async () => {
      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByRole("heading", { name: "No reviews yet" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Reviews will appear here once they are fetched from Google.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /filter by rating/i }),
      ).toBeInTheDocument();
    });
  });

  describe("user with reviews", () => {
    const mockReview = {
      id: "review-1",
      external_review_id: "ext-1",
      reviewer_name: "John Doe",
      reviewer_photo_url: null,
      rating: 5,
      review_text: "Great service!",
      review_date: "2024-01-15T10:00:00Z",
      has_response: false,
      status: "pending",
      sentiment: "positive",
      created_at: "2024-01-15T10:00:00Z",
      location_id: "loc-1",
      platform: "google",
      locations: {
        id: "loc-1",
        name: "Main Location",
        google_location_id: "google-loc-1",
      },
    };

    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          locations: [{ id: "loc-1" }],
          reviews: [mockReview],
        }),
      );
    });

    it("renders review cards", async () => {
      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(screen.getByText("Great service!")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders review with pending status badge", async () => {
      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(screen.getByText("pending")).toBeInTheDocument();
    });

    it("renders generate response button for pending reviews", async () => {
      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByRole("button", { name: "Generate Response" }),
      ).toBeInTheDocument();
    });
  });

  describe("error states", () => {
    it("handles user lookup failure", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          userError: new Error("User not found"),
        }),
      );

      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByText(
          "Unable to load your account information. Please try again later.",
        ),
      ).toBeInTheDocument();
    });

    it("handles missing user data", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          userData: null,
        }),
      );

      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByText(
          "Unable to load your account information. Please try again later.",
        ),
      ).toBeInTheDocument();
    });

    it("handles user with no organization", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          userData: { id: "user-1", organization_id: null },
        }),
      );

      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByText("Please complete your account setup to view reviews."),
      ).toBeInTheDocument();
    });

    it("handles locations fetch failure", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          locationsError: new Error("Failed to fetch locations"),
        }),
      );

      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByText("Failed to load locations. Please try again later."),
      ).toBeInTheDocument();
    });

    it("handles reviews fetch failure", async () => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          locations: [{ id: "loc-1" }],
          reviewsError: new Error("Failed to fetch reviews"),
        }),
      );

      const Component = await ReviewsPage({ searchParams: {} });
      render(Component);
      expect(
        screen.getByText("Failed to load reviews. Please try again later."),
      ).toBeInTheDocument();
    });
  });

  describe("filtered empty state", () => {
    beforeEach(() => {
      vi.mocked(createServerSupabaseClient).mockResolvedValue(
        createMockSupabaseClient({
          locations: [{ id: "loc-1" }],
          reviews: [],
        }),
      );
    });

    it("shows filtered empty state when filters are active", async () => {
      const Component = await ReviewsPage({
        searchParams: { status: "pending" },
      });
      render(Component);
      expect(
        screen.getByRole("heading", { name: "No reviews match your filters" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your filters to see more reviews."),
      ).toBeInTheDocument();
    });
  });
});
