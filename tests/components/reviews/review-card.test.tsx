import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReviewCard } from "@/components/reviews/review-card";

describe("components/reviews/ReviewCard", () => {
  it("renders review content and calls onGenerateResponse for pending reviews", async () => {
    const user = userEvent.setup();
    const onGenerateResponse = vi.fn();

    render(
      <ReviewCard
        review={{
          id: "rev_1",
          location_id: null,
          platform: "google",
          external_review_id: "ext_1",
          reviewer_name: "Ryan",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great experience.",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
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
        review={{
          id: "rev_2",
          location_id: null,
          platform: "google",
          external_review_id: "ext_2",
          reviewer_name: null,
          reviewer_photo_url: null,
          rating: 4,
          review_text: "Nice.",
          review_date: null,
          has_response: true,
          status: "responded",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
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
        review={{
          id: "rev_3",
          location_id: null,
          platform: "google",
          external_review_id: "ext_3",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Generate Response" }),
    ).not.toBeInTheDocument();
  });

  it("renders status badge for responded status", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_4",
          location_id: null,
          platform: "google",
          external_review_id: "ext_4",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: true,
          status: "responded",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("responded")).toBeInTheDocument();
  });

  it("renders status badge for ignored status", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_5",
          location_id: null,
          platform: "google",
          external_review_id: "ext_5",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "ignored",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("ignored")).toBeInTheDocument();
  });

  it("renders status badge with pending style for unknown status", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_6",
          location_id: null,
          platform: "google",
          external_review_id: "ext_6",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "unknown" as never,
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("renders Anonymous when reviewer_name is null", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_7",
          location_id: null,
          platform: "google",
          external_review_id: "ext_7",
          reviewer_name: null,
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("renders question mark avatar when reviewer_name is null", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_8",
          location_id: null,
          platform: "google",
          external_review_id: "ext_8",
          reviewer_name: null,
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders first character of reviewer_name as avatar initial", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_9",
          location_id: null,
          platform: "google",
          external_review_id: "ext_9",
          reviewer_name: "Jane Doe",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders Unknown date when review_date is null", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_10",
          location_id: null,
          platform: "google",
          external_review_id: "ext_10",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: null,
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("Unknown date")).toBeInTheDocument();
  });

  it("formats review_date correctly", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_11",
          location_id: null,
          platform: "google",
          external_review_id: "ext_11",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-15T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
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
        review={{
          id: "rev_12",
          location_id: null,
          platform: "google",
          external_review_id: "ext_12",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: null,
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("No review text")).toBeInTheDocument();
  });

  it("renders correct number of filled stars for rating 5", () => {
    const { container } = render(
      <ReviewCard
        review={{
          id: "rev_13",
          location_id: null,
          platform: "google",
          external_review_id: "ext_13",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(".text-star");
    const emptyStars = container.querySelectorAll(".text-star-empty");
    expect(filledStars.length).toBe(5);
    expect(emptyStars.length).toBe(0);
  });

  it("renders correct number of filled stars for rating 3", () => {
    const { container } = render(
      <ReviewCard
        review={{
          id: "rev_14",
          location_id: null,
          platform: "google",
          external_review_id: "ext_14",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 3,
          review_text: "OK",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(".text-star");
    const emptyStars = container.querySelectorAll(".text-star-empty");
    expect(filledStars.length).toBe(3);
    expect(emptyStars.length).toBe(2);
  });

  it("renders all empty stars when rating is 0", () => {
    const { container } = render(
      <ReviewCard
        review={{
          id: "rev_15",
          location_id: null,
          platform: "google",
          external_review_id: "ext_15",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 0,
          review_text: "Bad",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(".text-star");
    const emptyStars = container.querySelectorAll(".text-star-empty");
    expect(filledStars.length).toBe(0);
    expect(emptyStars.length).toBe(5);
  });

  it("renders all empty stars when rating is null", () => {
    const { container } = render(
      <ReviewCard
        review={{
          id: "rev_16",
          location_id: null,
          platform: "google",
          external_review_id: "ext_16",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: null,
          review_text: "No rating",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(".text-star");
    const emptyStars = container.querySelectorAll(".text-star-empty");
    expect(filledStars.length).toBe(0);
    expect(emptyStars.length).toBe(5);
    expect(screen.getByText("0 out of 5 stars")).toBeInTheDocument();
  });

  it("renders correct star rating for rating 1", () => {
    const { container } = render(
      <ReviewCard
        review={{
          id: "rev_17",
          location_id: null,
          platform: "google",
          external_review_id: "ext_17",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 1,
          review_text: "Terrible",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: "pending",
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    const filledStars = container.querySelectorAll(".text-star");
    const emptyStars = container.querySelectorAll(".text-star-empty");
    expect(filledStars.length).toBe(1);
    expect(emptyStars.length).toBe(4);
    expect(screen.getByText("1 out of 5 stars")).toBeInTheDocument();
  });

  it("renders status badge with default pending style when status is null", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_18",
          location_id: null,
          platform: "google",
          external_review_id: "ext_18",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: null as never,
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("does not show Generate Response button when status is null", () => {
    render(
      <ReviewCard
        review={{
          id: "rev_19",
          location_id: null,
          platform: "google",
          external_review_id: "ext_19",
          reviewer_name: "John",
          reviewer_photo_url: null,
          rating: 5,
          review_text: "Great!",
          review_date: "2025-01-01T00:00:00.000Z",
          has_response: false,
          status: null as never,
          sentiment: null,
          created_at: "2025-01-01T00:00:00.000Z",
        }}
        onGenerateResponse={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Generate Response" }),
    ).not.toBeInTheDocument();
  });
});
