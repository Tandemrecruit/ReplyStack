import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReviewCard } from "@/components/reviews/review-card";
import type { Review } from "@/lib/supabase/types";

describe("components/reviews/ReviewCard", () => {
  const createMockReview = (overrides: Partial<Review> = {}): Review => ({
    id: "rev_default",
    location_id: null,
    platform: "google",
    external_review_id: "ext_default",
    reviewer_name: "John",
    reviewer_photo_url: null,
    rating: 5,
    review_text: "Great!",
    review_date: "2025-01-01T00:00:00.000Z",
    has_response: false,
    status: "pending",
    sentiment: null,
    created_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  });
  it("renders review content and calls onGenerateResponse for pending reviews", async () => {
    const user = userEvent.setup();
    const onGenerateResponse = vi.fn();

    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_1",
          external_review_id: "ext_1",
          reviewer_name: "Ryan",
          review_text: "Great experience.",
        })}
        onGenerateResponse={onGenerateResponse}
      />,
    );

    expect(screen.getByText("Ryan")).toBeInTheDocument();
    expect(screen.getByText("Great experience.")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("5 out of 5 stars")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generate Response" }));
    expect(onGenerateResponse).toHaveBeenCalledWith("rev_1");
  });

  it("does not show Generate Response button when review is not pending", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_2",
          external_review_id: "ext_2",
          reviewer_name: null,
          rating: 4,
          review_text: "Nice.",
          review_date: null,
          has_response: true,
          status: "responded",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Generate Response" }),
    ).not.toBeInTheDocument();
  });

  it("does not show Generate Response button when onGenerateResponse is not provided", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_3",
          external_review_id: "ext_3",
        })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Generate Response" }),
    ).not.toBeInTheDocument();
  });

  it("renders status badge for responded status", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_4",
          external_review_id: "ext_4",
          has_response: true,
          status: "responded",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("responded")).toBeInTheDocument();
  });

  it("renders status badge for ignored status", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_5",
          external_review_id: "ext_5",
          status: "ignored",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("ignored")).toBeInTheDocument();
  });

  it("renders status badge with pending style for unknown status", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_6",
          external_review_id: "ext_6",
          status: "unknown" as never,
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("renders Anonymous when reviewer_name is null", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_7",
          external_review_id: "ext_7",
          reviewer_name: null,
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("renders question mark avatar when reviewer_name is null", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_8",
          external_review_id: "ext_8",
          reviewer_name: null,
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders first character of reviewer_name as avatar initial", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_9",
          external_review_id: "ext_9",
          reviewer_name: "Jane Doe",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders Unknown date when review_date is null", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_10",
          external_review_id: "ext_10",
          review_date: null,
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("Unknown date")).toBeInTheDocument();
  });

  it("formats review_date correctly", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_11",
          external_review_id: "ext_11",
          review_date: "2025-01-15T00:00:00.000Z",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    const formattedDate = new Date(
      "2025-01-15T00:00:00.000Z",
    ).toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it("renders No review text when review_text is null", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_12",
          external_review_id: "ext_12",
          review_text: null,
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("No review text")).toBeInTheDocument();
  });

  it("renders correct number of filled stars for rating 5", () => {
    const { container } = render(
      <ReviewCard
        review={createMockReview({
          id: "rev_13",
          external_review_id: "ext_13",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(
      '[data-testid="star-filled"]',
    );
    const emptyStars = container.querySelectorAll('[data-testid="star-empty"]');
    expect(filledStars.length).toBe(5);
    expect(emptyStars.length).toBe(0);
  });

  it("renders correct number of filled stars for rating 3", () => {
    const { container } = render(
      <ReviewCard
        review={createMockReview({
          id: "rev_14",
          external_review_id: "ext_14",
          rating: 3,
          review_text: "OK",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(
      '[data-testid="star-filled"]',
    );
    const emptyStars = container.querySelectorAll('[data-testid="star-empty"]');
    expect(filledStars.length).toBe(3);
    expect(emptyStars.length).toBe(2);
  });

  it("renders all empty stars when rating is 0", () => {
    const { container } = render(
      <ReviewCard
        review={createMockReview({
          id: "rev_15",
          external_review_id: "ext_15",
          rating: 0,
          review_text: "Bad",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(
      '[data-testid="star-filled"]',
    );
    const emptyStars = container.querySelectorAll('[data-testid="star-empty"]');
    expect(filledStars.length).toBe(0);
    expect(emptyStars.length).toBe(5);
  });

  it("renders all empty stars when rating is null", () => {
    const { container } = render(
      <ReviewCard
        review={createMockReview({
          id: "rev_16",
          external_review_id: "ext_16",
          rating: null,
          review_text: "No rating",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(
      '[data-testid="star-filled"]',
    );
    const emptyStars = container.querySelectorAll('[data-testid="star-empty"]');
    expect(filledStars.length).toBe(0);
    expect(emptyStars.length).toBe(5);
    expect(screen.getByText("0 out of 5 stars")).toBeInTheDocument();
  });

  it("renders correct star rating for rating 1", () => {
    const { container } = render(
      <ReviewCard
        review={createMockReview({
          id: "rev_17",
          external_review_id: "ext_17",
          rating: 1,
          review_text: "Terrible",
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(
      '[data-testid="star-filled"]',
    );
    const emptyStars = container.querySelectorAll('[data-testid="star-empty"]');
    expect(filledStars.length).toBe(1);
    expect(emptyStars.length).toBe(4);
    expect(screen.getByText("1 out of 5 stars")).toBeInTheDocument();
  });

  it("renders status badge with default pending style when status is null", () => {
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_18",
          external_review_id: "ext_18",
          status: null as never,
        })}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("shows Generate Response button when status is null (treated as pending)", async () => {
    const user = userEvent.setup();
    const onGenerateResponse = vi.fn();
    render(
      <ReviewCard
        review={createMockReview({
          id: "rev_19",
          external_review_id: "ext_19",
          status: null as never,
        })}
        onGenerateResponse={onGenerateResponse}
      />,
    );

    const button = screen.getByRole("button", { name: "Generate Response" });
    expect(button).toBeInTheDocument();

    // Verify button works
    await user.click(button);
    expect(onGenerateResponse).toHaveBeenCalledWith("rev_19");
  });
});
