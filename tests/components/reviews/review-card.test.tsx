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
    ).toBeNull();
  });
});
